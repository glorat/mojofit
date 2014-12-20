use strict;
use warnings;

package Fitstore;

use JSON;
use DateTime;
use DateTime::Format::DateParse;

our $DATA_DIR;

our $MAX_DATE = DateTime::Format::DateParse->parse_datetime('2020-01-01')->epoch; # 2020 bug :)
our $MIN_DATE = 60*60*24*265; # Go on... log all the way back to epoch + 1yr (to mitigate silly parsing bugs)


sub new {
	my ($class, $id) = @_;
	
	$DATA_DIR or die 'Fitstore::DATA_DIR has not been inited. Code bug';
	
	# Sanitise $id
	my $self = {id=>$id, index=>0, data=>{}};
	bless $self, $class;
	$self->load_from_stream;
	return $self;
}

sub handle_item_submitted {
	# Nothing doing for validation
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


# Inplace sanitisation
sub _sanitise_item {
	my ($item) = @_;
	$item->{date} += 0; # Force numeric
	
	# Handle case where json passes in milli
	if ($item->{date} > 10000000000) {
		$item->{date} /= 1000; # We are storing *seconds* since epoch in event store
	}
	if ($item->{date} > $MAX_DATE) {
		die "Invalid date $item->{date}\n";
	}
	elsif ($item->{date} < $MIN_DATE) {
		die "Invalid date in the past $item->{date}\n";
	}
	return $item;
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
	my $self = {id=>$id, index=>0, by_date=>{}};
	bless $self, $class;
	$self->load_from_stream;
	return $self;
}

sub handle_item_submitted {
	my ($self, $event) = @_;
	my $item = $event->{item};
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
	
	$self->{bydate}->{$item->{date}} = $item;
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