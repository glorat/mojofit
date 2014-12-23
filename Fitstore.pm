use strict;
use warnings;

package Fitstore;

use JSON;
use DateTime;
use DateTime::Format::DateParse;
use File::Copy qw(copy);

our $DATA_DIR;

our $MAX_DATE = DateTime::Format::DateParse->parse_datetime('2020-01-01')->epoch; # 2020 bug :)
our $MIN_DATE = 60*60*24*265; # Go on... log all the way back to epoch + 1yr (to mitigate silly parsing bugs)


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

sub handle_item_submitted {
	my ($self, $ev) = @_;
	$self->{dates}->{$ev->{item}->{date}} = 1;
}

sub handle_item_deleted {
	my ($self, $ev) = @_;
	delete $self->{dates}->{$ev->{date}};
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

sub delete_workout {
	my ($self, $origdate) = @_;
	my $date = _sanitise_date($origdate);
	if (!$self->{dates}->{$date}) {
		die ("Entry for date $date does not exist currently");
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
		die ("Supplied date $origdate mismatches UTC midnight. Bug in submission\n");
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

sub new {
	my ($class, $id) = @_;
	# Sanitise $id
	my $self = {id=>$id, index=>0, bydate=>{}};
	bless $self, $class;
	$self->load_from_stream;
	return $self;
}

sub handle_item_submitted {
	my ($self, $event) = @_;
	my $item = $event->{item};
	$item->{date} = Fitstore::_sanitise_date_unsafe($item->{date});
	$item->{date} *= 1000; # JS likes millis
	$item->{actions} = [map {
		$_->{sets} = [map {
			my $set = $_;
			if ($set->{lb}) {
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
	
	# $self->{bydate}->{$item->{date}} = $item;
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
	my @items = map {$self->{bydate}->{$_}} (@keys);
	open OUT, ">$Fitstore::DATA_DIR/$self->{id}.json";
	print OUT encode_json(\@items);
	close OUT; 
}

1