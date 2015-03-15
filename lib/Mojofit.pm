package Mojofit;

use Mojo::Base 'Mojolicious';

use File::Util;
use Data::Dumper;
use Mojo::DOM;
use List::Util qw(first max maxstr min minstr reduce shuffle sum);
use List::MoreUtils qw(all);
use DateTime;
use DateTime::Format::DateParse;
use Data::Google::Visualization::DataTable;

use JSON; 

use SLIC;
use Mojofit;
use Mojofit::Model;
use Mojofit::Global qw(read_file);
use Fitstore;

use Mojofit::DB;
use Mojofit::Model::Users;
use FindBin;

our $DATA_DIR = "$FindBin::Bin/data";



# Util objects
our $f = File::Util->new();


sub startup {
	my $self = shift;
	$self->log->warn('Starting up');
	
	$Fitstore::DATA_DIR = $DATA_DIR;
	
	$self->helper(users => sub { state $users = Mojofit::Model::Users->new });

	$self->moniker('mojofit');
	$self->secrets(['Some randomly chosen secret passphrase for cookies!@£!@£!£']);

	$self->plugin('config');
	my $dbconf = $self->config->{dbi};
	$dbconf->{helper} = 'db';

	$self->helper(dbic => sub {
		my $app = shift;
		my $cfg = $app->config->{dbi};
		return Mojofit::DB->connect($cfg->{dsn}, $cfg->{username}, $cfg->{password}, {mysql_auto_reconnect=>1});
	});
	
	$self->helper(mg => sub {
		my $app = shift;
		my $cfg = $app->config->{mg};
		my $mg = WWW::Mailgun->new($cfg);
		return $mg;
	});
	$self->hook(after_dispatch => sub {
	    my $tx = shift;

	    # Was the response dynamic?
	    return if $tx->res->headers->header('Expires');
	    
	    # If so, try to prevent caching
	    $tx->res->headers->header(
		Expires => Mojo::Date->new(time-365*86400)
		);
	    $tx->res->headers->header(
		"Cache-Control" => "max-age=1, no-cache"
		);
		   });

	
my $r = $self->routes;

$r->any('/' => sub {
    shift->reply->static('index.html');
});

# FIXME: this is vulnerable to to some XS attack. Change to POST or prefix the JSON
$r->any('/auth/getUserStatus')->to('auth#getUserStatus');

$r->post('/auth/login')->to('auth#login');

$r->post('/auth/logout')->to('auth#logout');

$r->post('/auth/register')->to('auth#register');

$r->post('/auth/changepass')->to('auth#changepass');

$r->post('/command/submitWorkouts')->to('command#submit_workouts');

$r->post('/command/submitWeight')->to('command#submit_weight');

$r->post('/command/submitPrefs')->to('command#submit_prefs');

$r->post('/command/deleteWorkout')->to('command#delete_workout');

$r->get('/command/crazy')->to('command#crazy');

$r->get('/userraw/#username' => sub {
	my $c = shift;
	my $target = $c->param('username');
	$target =~ m/^[A-Za-z0-9\-\.]+$/ or return $c->render(text => 'Invalid username');
	
	if (-f "$DATA_DIR/${target}.json") {
		my $jsonStream=read_file("$DATA_DIR/${target}.json", ':encoding(UTF-8)');
		$c->render(text => $jsonStream, format=>'json');
	}
	else {
		# FIXME: only 404 if the user doesn't exist in the DB!
		#$c->res->code(404);
		#return $c->render(json => "Unknown username $target");
		return $c->render(json=>{revision=>0, items=>[], prefs=>{}});
	}
});

$r->any('/userjson/:username/:minsets/:minreps/:period' => sub {userjson(@_)});

$r->any('/userjson/:username' => => sub {userjson(@_)});

$r->any('/uservolume/:username' => sub {
	my $c = shift;
	my $target = $c->param('username');
	$target =~ m/^[A-Za-z0-9\-\.]+$/ or return $c->render(text => 'Invalid username');
	my $stream = Mojofit::Stream::getStream($target);
	
	my $ret = '';
	foreach my $item (@$stream) {
		if ($item->maxFor('Barbell Squat')) {
			$ret .= $item->{date} . ' ' . $item->maxFor('Barbell Squat') . ' '. $item->volumeFor('Barbell Squat')."\n";
		}
	}
	$c->render(text => $ret);
	
});

$r->any('/debug' => sub {
    my $c = shift;
	my @nms = $c->param;
	my $str = $c->req->body;
	$str .= "\n";
	foreach (@nms) {
		$str.="$_ : " . $c->param($_) ."\n";
	}
    $c->render(text => $str);
});

$r->get('/slic' => sub {
	my $c = shift;
	$c->redirect_to("/#/slic");
});

$r->post('/slicparse' => sub {
	my $c = shift;
	my $text = $c->param('text');
	
	open OUT, ">$DATA_DIR/prev.txt";
	print OUT $text;
	close OUT;
	my $id;
	
	eval {
		my ($name, $items, $warns) = SLIC::parse_text($text);
		foreach (@$warns) { 
			$c->app->log->warn($_);
		}
		#$name =~ s/ //g;
		$name =~ s/\W//g; # Kill non-word chars for now. Be safe
	
		$id = $c->session('id');
		$id or die ("Please return to the home page and then come back and try again\n");
	
		# Put in event store
		my $store = Fitstore->new($id);
		$store->submit_workouts($items);
	
		my $view = Fitstore::MainView->new($id);
		$view->write_by_date();
	};
	if ($@) {
		$c->render(text=>$@);
	}
	else {
		$c = $c->redirect_to("/#/user/$id");
	}
	
	
	
});

$r->get('/*whatever' => {whatever => ''} => sub {
  my $c        = shift;
  my $whatever = $c->param('whatever');
  
  $c->reply->static('index.html');
});

# end startup
}


sub userjson {
	my $c = shift;
	my $target = $c->param('username');
	$target =~ m/^[A-Za-z0-9\-\.]+$/ or return $c->render(text => 'Invalid username');
	my $minsets = $c->param('minsets') || 1;
	my $minreps = $c->param('minreps') || 1;
	my $period = $c->param('period') || 0;
	my $js = getTargetJson($target, $minsets, $minreps, $period);
	my $json = "jsonData=$js;";
	$c->render(text => $json, format => 'javascript');
}

our @POWERLIFTS = ('Barbell Squat', 'Barbell Bench Press', 'Barbell Deadlift', 'Standing Barbell Shoulder Press (OHP)', 'Pendlay Row');
our %POWERSET = map {$_ => 1} (@POWERLIFTS);


sub getMaxStream {
	my ($target) = @_;
	my $stream = Mojofit::Stream::getStream($target);
	if ($target !~ m/^SLIC-/) {
		# Fito
		$stream->filterMaxWeight;
	}
	return $stream;
}

sub getTargetJson {
	my ($target, $minsets, $minreps, $period) = @_;
	return '' unless $f->can_read("$DATA_DIR/${target}.json");
	my $stream = getMaxStream($target);
	$stream->filterSetReps($minsets, $minreps);
	
	
	$stream->consistency;
	$stream->movingMax($stream, $period);
	return powerTableMax($stream, $period);
	#return powerTableConMax($stream, $period);

}


sub adjustedMax {
	my ($origstream,  $perdays) = @_;
	$perdays ||=1;
	my $LOOKBACK= $perdays * 24 * 60 *60; # Days to secs
	# Need a contiguous stream for this algo!
	my $stream = $origstream->toListByDate;
	my %prev = (); #map {$_ => 0 } (@POWERLIFTS);
	for my $i (0..scalar(@$stream)-1) {
		my $item = $stream->[$i];
		my $back = $i - $perdays;
		$back = 0 if $back < 0;
		# Go from back to behind current
		# Baseline the point from which we want to see improvements
		my %permax = %{$stream->[$back]->{'permax'}};
		# Inductively adjusted to current
		$back ++;
		while ($back < $i) {
			my $old = $stream->[$back];
			foreach (@POWERLIFTS) {
				my $oldmax = $old->{'permax'}->{$_};
				if ($oldmax > $permax{$_}) {
					# We are moving on up!
					$permax{$_} = $oldmax
				}
				else {
					# We didn't improve but...
					if ($item->maxFor($_) > $permax{$_}) {
						# It was just a blip - ignore it
						$oldmax->{'permax'}->{$_} = undef;
						
					}
					else {
						# No more improvements count - exit look
						last;
					}
				}
				# Keep going here!!!
			}
			$back++;
			
		}
		
		#print STDERR "$item->{date} $workouts\n";
	}
}

sub formatStream {
	my ($c, $stream) = @_;
	my $ret = '';
	my $showNotes = $c->param('shownotes');
	# Display
	foreach my $item (@$stream) {
		my $dt = DateTime->from_epoch( epoch => $item->{date});
		$ret .= $dt->ymd. "\n";
		foreach my $action (@{$item->{actions}}) {
			$ret .= " $action->{name} : ";
			foreach my $set ($action->{sets}) {
				$ret .= formatSets($set);
			}
			$ret .= "Notes: $item->{notes}" if $showNotes;
		}
		$ret .= "\n";
	}
	return $ret;
}

sub powerTableMax {
	my ($streamItems, $period) = @_;
	my $maxfld = $period ? 'permax' : 'max';
	my $datatable = Data::Google::Visualization::DataTable->new();
	my @powercols = map { {id=>'', label=>$_, type=>'number'}} @POWERLIFTS;
	 $datatable->add_columns(
	        { id => 'date',     label => "Date",        type => 'date', p => {}},
			{ id => 'consistency',     label => "Consistency",        type => 'number', p => {}},
	        @powercols,
	 );

	 foreach my $item (@$streamItems) {
		 my @row = ({v=>$item->{date}}, {v=>$item->{consistency}},  );
		 map { push @row, {v=>$item->{$maxfld}->{$_}} } (@POWERLIFTS);
		 $datatable->add_rows(\@row);
	 }
	 my $output = $datatable->output_javascript();
	 return $output;
}

sub powerTableConMax {
	my ($streamItems, $period) = @_;
	my $maxfld = $period ? 'permax' : 'max';
	my $datatable = Data::Google::Visualization::DataTable->new();
	my @powercols = map { {id=>'', label=>$_, type=>'number'}} @POWERLIFTS;
	 $datatable->add_columns(
			{ id => 'consistency',     label => "Work",        type => 'number', p => {}},
	        @powercols,
	 );

	 foreach my $item (@$streamItems) {
		 my @row = ({v=>$item->{sumcon}, f=>"$item->{sumcon} - ".$item->date->ymd},  );
		 map { push @row, {v=>$item->{$maxfld}->{$_}} } (@POWERLIFTS);
		 $datatable->add_rows(\@row);
	 }
	 my $output = $datatable->output_javascript();
	 return $output;
}


sub calcVolumeFromWorkout {
	my ($item) = @_;
	foreach my $action (@{$item->{actions}}) {
		if ($action->{sets}->[0]->{kg} && $action->{sets}->[0]->{reps} ) {
			my $volume = sum (map {$_->{kg} * $_->{reps}} (@{$action->{sets}}));
			$action->{'volume'} = $volume;
		}
	}
	return $item;
}


sub parseSetText {
	my $setText = shift;
	my %setData;
	if ($setText =~ m/([\d\.]+) kg/) {
		$setData{kg} = $1;
	}
	if ($setText =~ m/([\d\.]+) reps/) {
		$setData{reps} = $1;
	}
	$setData{text} = $setText;
	return \%setData;
}

sub formatSets {
	my ($sets) = @_;
	my $ret = '';
	if ($sets->[0]->{kg}) {
		$ret .= formatWeightedSets($sets);
	}
	else {
		foreach my $set (@$sets) {
			$ret .= $set->{kg}. " kg " if $set->{kg};
			$ret .= $set->{reps}." reps " if $set->{reps};
			$ret .= "\n";
		}
	}
	return $ret;
}

sub formatWeightedSets {
	my ($sets) = @_;
	my $ret = '';
	return "" if (0==scalar(@$sets)); # Warn?
	foreach my $set (@$sets) {
		#print $set->{kg}. " kg " if $set->{kg};
		#print $set->{reps}." reps " if $set->{reps};
		#print "\n";
	}
	my $max = max(map {$_->{kg}} (@$sets));
	my @maxset = grep {$_->{kg} eq $max} (@$sets);
	#print "Max $max kg\n";
	if (all {$_->{reps} == $maxset[0]->{reps}} (@maxset)) {
		my $n = scalar(@maxset);
		$ret .= "  ${n}x$sets->[0]->{reps} ${max}kg\n";
	}
	else {
		my $reps = join('/', map {$_->{reps}} (@maxset));
		$ret .= "  $reps ${max}kg\n";
	}
	return $ret;
}
