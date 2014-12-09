#!/usr/bin/perl
use FindBin;
use lib "$FindBin::Bin/lib";
use strict;

use File::Util;
use Data::Dumper;
use Mojo::DOM;
use List::Util qw(first max maxstr min minstr reduce shuffle sum);
use List::MoreUtils qw(all);
use DateTime;
use DateTime::Format::DateParse;
use Data::Google::Visualization::DataTable;

use Mojolicious::Lite;
use JSON; 

use SLIC;
use Mojofit;
use Fitstore;

our $DATA_DIR = "$FindBin::Bin/data";
$Fitstore::DATA_DIR = $DATA_DIR;
$Mojofit::DATA_DIR = $DATA_DIR;

#plugin 'TagHelpers';

# Config
our @POWERLIFTS = ('Barbell Squat', 'Barbell Bench Press', 'Barbell Deadlift', 'Standing Barbell Shoulder Press (OHP)', 'Pendlay Row');
our %POWERSET = map {$_ => 1} (@POWERLIFTS);



# Util objects
our($f) = File::Util->new();

helper users => sub { state $users = Mojofit::Model::Users->new };
app->secrets(['Some randomly chosen secret passphrase for cookies!@£!@£££']);
my $uri = 'mysql://mojofit:mojoglobal@localhost/mojofit'; # <user>:<pass>@
#helper db => sub { state $db = Mango->new($uri) };


any '/' => sub {
    shift->reply->static('index.html');
};

get '/getUserStatus' => sub {
	my $c = shift;
	my $status = {};
	eval {
		if ($c->session('email')) {
			# Logged in
			my $user = $c->users($c->session('email'));
			$user or $status->{error} = 'Unable to load you from database';
			$status->{isLoggedIn} = 1;
			$status->{userPrefs} = $user->{userPrefs};
		}
		else {
			$status->{isLoggedIn} = 0;
		}
	};
	
	if ($!) {
		$status->{error} = $_;
	}
	$c->render(json => $status);
};


post '/login' => sub {
	my $c = shift;
    my $email = lc($c->param('email') || '');
    my $pass = $c->param('pass') || '';
 
    # Check password and render "index.html.ep" if necessary
    return $c->render(json => {error=>'Failed to log in'}) unless $c->users->check($email, $pass);
 	my $user = $c->users->get($email);
	
    # Store login in session
    $c->session(email => $email);
	$c->session(expiration => 3600*24*30); # 30-days for now. Low security
	
	my $status = {isLoggedIn=>1, userPrefs=> $user->{userPrefs}};
	$c->render(json=>$status);
	
};

post '/register' => sub {
	my $c = shift;
   	my $ip = $c->tx->remote_address; 	
};


get '/user/:username' => sub {
	my $c = shift;

	my $target = $c->param('username');
	$target =~ m/^[A-Za-z0-9\-\.]+$/ or return $c->render(text => 'Invalid username');
	
	$c->redirect_to("/#/user/$target");
};

get '/userraw/:username' => sub {
	my $c = shift;
	my $target = $c->param('username');
	$target =~ m/^[A-Za-z0-9\-\.]+$/ or return $c->render(text => 'Invalid username');
	
	$f->can_read("$DATA_DIR/${target}.json") or return $c->render(json => 'Unknown username');
	my $jsonStream=$f->load_file("$DATA_DIR/${target}.json");
	# TODO: json
	$c->render(text => $jsonStream, format=>'json');

};

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

any '/userjson/:username/:minsets/:minreps/:period' => sub {userjson(@_)};

any '/userjson/:username' => => sub {userjson(@_)};

any '/uservolume/:username' => sub {
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
	
};

any '/debug' => sub {
    my $c = shift;
	my @nms = $c->param;
	my $str = $c->req->body;
	$str .= "\n";
	foreach (@nms) {
		$str.="$_ : " . $c->param($_) ."\n";
	}
    $c->render(text => $str);
};

get '/slic' => sub {
	my $c = shift;
	$c->redirect_to("/#/slic");
};

post '/slicparse' => sub {
	my $c = shift;
	my $text = $c->param('text');
	
	open OUT, ">$DATA_DIR/prev.txt";
	print OUT $text;
	close OUT;
	
	my ($name, $items, $warns) = SLIC::parse_text($text);
	foreach (@$warns) { 
		$c->app->log->warn($_);
	}
	#$name =~ s/ //g;
	$name =~ s/\W//g; # Kill non-word chars for now. Be safe
	
	# Put in event store
	my $store = Fitstore->new($name);
	$store->submit_workouts($items);
	
	my $view = Fitstore::MainView->new($name);
	$view->write_by_date();
	
	$c = $c->redirect_to("/user/$name");
	
};

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


#sub Mojo::Collection::DESTROY {
#	# Nothing doing! Do not autoload call
#}

app->start;

__DATA__
