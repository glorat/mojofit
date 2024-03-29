use strict;
use warnings;

package Fitstore;

use JSON;
use DateTime;
use DateTime::Format::DateParse;
use File::Copy qw(copy);

our $DATA_DIR;

our $MAX_DATE = DateTime::Format::DateParse->parse_datetime('2030-01-01')->epoch; # 2020 bug :)
our $MIN_DATE = 60*60*24*265; # Go on... log all the way back to epoch + 1yr (to mitigate silly parsing bugs)

# TODO: Maintain last submitted workout so that accidental dupe requests can be treated as idempotent

sub new {
	my ($class, $id) = @_;
	
	$DATA_DIR or die 'Fitstore::DATA_DIR has not been inited. Code bug';
	
	# Sanitise $id
	my $self = {id=>$id, index=>0, data=>{}, dates=>{}};
	bless $self, $class;
	$self->load_from_stream;
	return $self;
}

sub clone {
	$DATA_DIR or die 'Fitstore::DATA_DIR has not been inited. Code bug';
	my ($from, $to) = @_;
	copy("$DATA_DIR/$from.dat", "$DATA_DIR/$to.dat");
	# Do the view for now too... but maybe not in future
	copy("$DATA_DIR/$from.json", "$DATA_DIR/$to.json");
}

sub handle_weight_submitted {
	# Nothing todo
	
}

sub handle_prefs_submitted {
	# Nothing todo
	
}

sub handle_item_submitted {
	my ($self, $ev) = @_;
	$self->{dates}->{$ev->{item}->{date}} = 1;
}

sub handle_plan_submitted {
	# Nothing todo
}

sub handle_item_deleted {
	my ($self, $ev) = @_;
	delete $self->{dates}->{$ev->{date}};
}

sub submit_prefs {
	my ($self, $orig) = @_;
	my $prefs = {}; # Operate on whitelist basis
	$prefs->{gender} = $orig->{gender} if ($orig->{gender} && $orig->{gender}=~m/^(m|f)$/ );
	$prefs->{dob} = _sanitise_date($orig->{dob}) if ($orig->{dob});
	$prefs->{preferredUnit} = $orig->{preferredUnit} if ($orig->{preferredUnit} && $orig->{preferredUnit}=~m/^(kg|lb)$/); 
	if (scalar keys %$prefs) {
		my $ev =  {action=>'prefs_submitted', body=>$prefs};
		$self->commit_append($ev);
	}
	else {
		die 'No preferences to submit\n'; # Throw better?
	}
	
}

sub submit_weight {
	my ($self, $cmd) = @_;
	my $date = _sanitise_date($cmd->{date});
	my $weight = $cmd->{body}->{weight};
	my $unit = $cmd->{body}->{unit};
	$weight += 0; 
	$weight =~ m/^[\d\.]+$/ or die ("Weight $weight is not a valid number\n");
	$unit =~ m/^(kg|lb)$/ or die ("Unit must be kg or lb\n");
	
	unless ($self->{dates}->{$date}) {
		die ("Please only submit bodyweight for days you are also logging a workout\n");
	}
	
	# No other validation for now!
	my $ev =  {action=>'weight_submitted', date=>$date, body=>{weight=>$weight, unit=>$unit}};
	$self->commit_append($ev);
}

sub submit_workouts {
	my ($self, $items) = @_;
	# Each $item should contain actions/date and optional notes
	foreach my $item (@$items) {
		$item->{date} or die ("Item has not date");
		$item->{actions} or die ("Item has no actions");
		_sanitise_item($item);
	}
	# No other validation for now!
	my @events = map { {action=>'item_submitted', item=>$_}} (@$items);
	$self->commit_append(\@events);
}

sub submit_plan {
	my ($self, $plan) = @_;
	$plan->{actions} or die ('Plan has no actions');
	# TODO: Call sanitise_item when we dont care about date there
	my $event = {action=>'plan_submitted', item=>$plan};
	$self->commit_append($event);
}

sub check_delete {
	my ($self, $origdate) = @_;
	my $date = _sanitise_date($origdate);
	if (!$self->{dates}->{$date}) {
		return "Entry for this date does not exist ($date)\n";
	}
	return undef;
}

sub delete_workout {
	my ($self, $origdate) = @_;
	my $date = _sanitise_date($origdate);
	if (!$self->{dates}->{$date}) {
		die ("Entry for this date does not exist currently ($date)\n");
	}
	my $event = {action=>'item_deleted', date=>$date};
	$self->commit_append($event);
	
}

# Inplace sanitisation
sub _sanitise_item {
	my ($item) = @_;
	
	$item->{date} = _sanitise_date($item->{date});
	
	return $item;
}

# Ensure UTC ness
sub _sanitise_date {
	my ($date) = @_;
	my $origdate = $date;
	if ($date> 10000000000) {
		$date/= 1000; # We are storing *seconds* since epoch in event store
	}
	my $epoch_time = _sanitise_date_unsafe($date);

	if ($epoch_time != $date) {
		my $diff = $epoch_time - $date;
		die ("Supplied date $origdate mismatches UTC midnight. Code bug in submission\n");
	}
	return $epoch_time;
}

# Don't die if UTC is out
sub _sanitise_date_unsafe {
	my ($date) = @_;
	my $origdate = $date;
	$date +=0 ;
	
	if ($date> 10000000000) {
		$date/= 1000; # We are storing *seconds* since epoch in event store
	}
	if ($date > $MAX_DATE) {
		die "Invalid date $origdate\n";
	}
	elsif ($date< $MIN_DATE) {
		die "Invalid date in the past $origdate\n";
	}
	
	my $dt = DateTime->from_epoch( epoch => $date );
	
	$dt = DateTime->new( year => $dt->year, month => $dt->month, day => $dt->day, time_zone => 'UTC' );
	my $epoch_time = $dt->epoch;
	return $epoch_time;
}

sub load_from_stream {
	my ($self) = @_;
	my $file = "$DATA_DIR/$self->{id}.dat";
	open IN, $file or return; # Warn if auto-creating new stream?
	while (<IN>) {
		my $line = $_;
		my $ev = decode_json($line);
		$self->handle($ev);
	}
	close IN;
}

sub commit_append {
	my ($self, $event) = @_;
	
	#print STDERR "commit_append on Fitstore::$self->{id}\n";
	
	my $file = "$DATA_DIR/$self->{id}.dat";
	# Open for r/w and lock!
	open FH, "+>>$file" or die ("Can't open $file for write-append: $!");
	# TODO: flock
	seek (FH, 0, Fcntl::SEEK_SET); # Start of file
	my $count = 0;
	while (<FH>) {$count++};
	seek(FH, 0, Fcntl::SEEK_END); # To end
	# TODO: Check for consistency
	if ('HASH'eq ref ($event)) {
		$event = [$event];
	}
	if ('ARRAY' eq ref($event)) {
		
		#print STDERR "There are ".scalar(@$event)." events to persist\n";
		
		foreach (@$event) {
			('HASH' eq ref($_)) or die 'Code bug: attempted to commit event that was not a hash';
			$_->{'time'} = time; # Stamp it
			print FH encode_json($_);
			print FH "\n";	
		}
	}
	else {
		Carp::confess("Event was malformed. Code bug");
	}
	close FH;
	
	foreach (@$event) {
		$self->handle($_);
	}
}

sub handle {
	my ($self, $ev) = @_;
	('HASH' eq ref($ev)) or confess ("Not a hashref:".($ev));
	my $method = "handle_$ev->{action}";
	
	$self->can($method) or die ("Not such handler for $ev->{action}");
	$self->$method($ev);
	$self->{index}++;
}

package Fitstore::MainView;
use JSON;
use Mojofit;

our @ISA = qw'Fitstore';
our $f = File::Util->new();

sub new {
	my ($class, $id) = @_;
	# Sanitise $id
	# body : date->recorded bodyweight
	my $self = {id=>$id, index=>0, bydate=>{}, prefs=>{}, body=>{}};
	bless $self, $class;
	$self->load_from_stream;
	return $self;
}

sub handle_plan_submitted {
	my ($self, $event) = @_;
	my $plan = $event->{item};
	$self->{plan} = $plan;
}

sub handle_prefs_submitted {
	my ($self, $event) = @_;
	my $newprefs = $event->{body};
	foreach (keys %$newprefs) {
		if ($_ eq 'dob') {
			$self->{prefs}->{$_} = 1000*$newprefs->{$_}; # JS bollocks
		}
		else {
			$self->{prefs}->{$_} = $newprefs->{$_};
		}
		
	}
}

sub handle_item_submitted {
	my ($self, $event) = @_;
	my $item = $event->{item};
	$item->{date} = Fitstore::_sanitise_date_unsafe($item->{date});
	$item->{date} *= 1000; # JS likes millis
	$item->{actions} = [map {
		$_->{sets} = [map {
			my $set = $_;
			if ($set->{unit}) {
			    # This is the normal case
			}
			elsif ($set->{lb}) {
				# Back compat
				$set->{kg} = 0.453592 * $set->{lb};
				$set->{unit} = 'lb';
				$set->{weight} = $set->{lb};
			}
			elsif($set->{kg}) {
				# Back compat
				$set->{unit} = 'kg';
				$set->{weight} = $set->{kg};
			}
			$set
		} (@{$_->{sets}})];
		$_;
		
	} (@{$item->{actions}})];
	# Perform a merge in!
	foreach my $key (keys %$item) {
		$self->{bydate}->{$item->{date}}->{$key} = $item->{$key};
	}
	
	# When a workout is submitted, the plan is emptied
	$self->{plan} = undef;
	
	# $self->{bydate}->{$item->{date}} = $item;
}

sub handle_weight_submitted {
	my ($self, $ev) = @_;
	my $body = $ev->{body};
	my $date = $ev->{date}*1000; # To JS millis
	$self->{body}->{$date} = $body;
}


sub handle_item_deleted {
	my ($self, $ev) = @_;
	my $dt = $ev->{date}*1000;
	if ($self->{bydate}->{$dt}) {
		delete $self->{bydate}->{$dt};	
	}
	else {
		# This is a serious bug to get here
		print STDERR "Nothing deleting at $ev->{date}\n";
	}
}

sub write_by_date {
	my ($self) = @_;
	my @keys = sort keys %{$self->{bydate}};
	my %bw = (weight=>0, unit=>'kg');
	my @items = map {
		my $date = $_;
		if ($self->{body}->{$date}) {
			%bw = %{$self->{body}->{$date}};
		}
		%{$self->{bydate}->{$date}->{body}} = %bw;
		$self->{bydate}->{$_}
	} (@keys);
	open OUT, ">$Fitstore::DATA_DIR/$self->{id}.json";
	print OUT encode_json({revision=>$self->{index}, items=>\@items, id=>$self->{id}, prefs=>$self->{prefs}, plan=>$self->{plan}});
	close OUT; 
	open OUT, ">$Fitstore::DATA_DIR/$self->{id}.revision";
	print OUT $self->{index};
	close OUT;
}

# Static
sub get_revision {
	my ($target) = @_;
	return 0 unless $f->can_read("$Mojofit::DATA_DIR/${target}.revision");
	# Auto string to int
	my $rev = $f->load_file("$Mojofit::DATA_DIR/${target}.revision");
	return 0 + $rev;
}

1
