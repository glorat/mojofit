use strict;
use warnings;
use File::Util;

our($f) = File::Util->new();

package Mojofit;

our @POWERLIFTS = ('Barbell Squat', 'Barbell Bench Press', 'Barbell Deadlift', 'Standing Barbell Shoulder Press (OHP)', 'Pendlay Row');
our %POWERSET = map {$_ => 1} (@POWERLIFTS);

package Mojofit::Set;
sub new {
	my ($class, $set) = @_;
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
	# else, weight/unit should be there
	bless $set, 'Mojofit::Set';
	
}

sub kg {
	my $self = shift;
	if (!$self->{unit}) {
		return 0;
	}
	elsif ($self->{unit} eq 'kg') {
		return $self->{weight}
	}
	elsif ($self->{unit} eq 'lb') {
		return $self->{weight} * 0.453592;
	}
	else {
		return 0;
	}
}


package Mojofit::Action;
use Data::Dumper;
use List::Util qw(first max maxstr min minstr reduce shuffle sum);
our %LIFT_ALIAS = (
    'Squat'=>'Barbell Squat',
    'Press'=>'Standing Barbell Shoulder Press (OHP)',
    'Overhead Press' => 'Standing Barbell Shoulder Press (OHP)',
    'Bench'=>'Barbell Bench Press',
    'Bench Press' => 'Barbell Bench Press',
    'Row' => 'Pendlay Row',
    'Barbell Row' => 'Pendlay Row',
    'Deadlift'=>'Barbell Deadlift',);

sub filterSetReps {
	my ($action, $sets, $reps) = @_;
	my @goodsets = grep {$_->{reps} && $_->{reps} >= $reps} (@{$action->{sets}});
	my $kg = getMaxFromSets(\@goodsets, $sets);
	#print "$sets x $reps max of $kg    @goodsets\n";
	$action->{max} = $kg;
	return $action;
}


sub filterMaxWeight {
	my ($action) = shift;
	my @sets = @{$action->{sets}};
	my @kgs = map {$_->kg} (@sets);
	@kgs or return $action;
	my $max = max (@kgs);
	$max ||= 0;
	my @maxsets = grep {$_->kg == $max} (@{$action->{sets}});
	$action->{sets} = \@maxsets;
	return $action;
}


# Static
sub getMaxFromSets {
	my ($sets, $minset) = @_;
	my %setreps;
	map { $setreps{$_->kg}++} (@$sets);
	foreach my $kg (sort keys %setreps) {
		return $kg if $setreps{$kg}>=$minset;
	}
	return undef;
}

sub name {
	my ($self) = @_;
	my $name = $self->{name};
	return $LIFT_ALIAS{$name} || $name;
}

package Mojofit::StreamItem;
use List::Util qw(first max maxstr min minstr reduce shuffle sum);

sub date {
	my ($item) = @_;
	$item->{dateobj} ||= DateTime->from_epoch( epoch => $item->{date});
}

sub maxFor {
	my ($item, $name) = @_;
	return $item->{max}->{$name} if exists($item->{max}->{$name});
	my $max = $item->getMaxFromItem($name);
	$item->{max}->{$name} = $max;
	return $max;
}

sub volumeFor {
	my ($item, $name) = @_;
	$item->calcVolumeFromItem unless exists $item->{volume};
	return $item->{volume}->{$name};
}

sub calcVolumeFromItem {
	my ($item) = @_;
	my %volmap;
	foreach my $action (@{$item->{actions}}) {
		if ($action->{sets}->[0]->kg && $action->{sets}->[0]->{reps} ) {
			my $volume = sum (map {$_->kg * $_->{reps}} (@{$action->{sets}}));
			$volmap{$action->name} = $volume;
		}
	}
	$item->{volume} =  \%volmap;
}

sub getMaxFromItem {
	my ($item, $name) = @_;
	
	foreach my $action (@{$item->{actions}}) {
		if ($name eq $action->name) {
			return $action->{max} if exists($action->{max});
			return $action->{sets}->[0]->kg;
		}
	}
	return undef;
}

sub validPowerLift {
	my ($item) = @_;
	return $item->maxFor('Barbell Squat') || $item->maxFor('Barbell Deadlift');
}

sub filterPowerLifts {
	my ($item) = @_;
	my @poweractions = grep {$Mojofit::POWERSET{$_->name}} (@{$item->{actions}});
	#my @poweractions = grep {$_->name =~ m/Barbell/ } (@{$item->{actions}});
	$item->{actions} = \@poweractions;
	return $item;
}

sub actionCount {
	return scalar(@{shift->{'actions'}});
}

package Mojofit::Stream;
use JSON;
use List::Util qw(first max maxstr min minstr reduce shuffle sum);
use List::MoreUtils qw(all);
use Data::Dumper;
use DateTime;

sub getStream {
	my ($target) = @_;
	return [] unless $f->can_read("$Mojofit::DATA_DIR/${target}.json");
	my $jsonStream=$f->load_file("$Mojofit::DATA_DIR/${target}.json");
	my $data = decode_json($jsonStream);
	my $stream = $data->{items};

	bless $stream, "Mojofit::Stream";
	foreach my $item (@$stream) {
		bless $item, 'Mojofit::StreamItem';
		$item->{date} /= 1000; # perl likes s, js likes ms
		foreach my $action (@{$item->{'actions'}}) {
			$action->{sets} = [map {Mojofit::Set->new($_)} (@{$action->{sets}})];
			bless $action, 'Mojofit::Action';
			#$action;
		}
	}
	if ($target !~ m/^SLIC-/) {
		# Fito
		$stream->filterPowerlifts;
	}
	
	return $stream;
}

# Methods
sub items {
	my ($stream) = @_;
	return @$stream; 
}


sub filterPowerlifts {
	my ($stream) = shift;
	my @ret;
				
	foreach my $item ($stream->items) {
		#my @poweractions = grep {$Mojofit::POWERSET{$_->name}} (@{$item->{actions}});
		#$item->{actions} = \@poweractions;
		$item->filterPowerLifts;
		#push @ret, $item if scalar(@poweractions);
		push @ret, $item if $item->actionCount;
	}

	# Updating self!!! FIXME
	@$stream = @ret;
	return $stream->items;
}


sub filterSetReps {
	my ($stream, $sets, $reps) = @_;
	foreach my $item ($stream->items) {
		foreach my $action (@{$item->{actions}}) {
			$action->filterSetReps($sets, $reps);
		}

	}
	return $stream;
}


sub filterMaxWeight {
	my ($stream) = shift;
	foreach my $item ($stream->items) {
		foreach my $action (@{$item->{actions}}) {
			$action->filterMaxWeight();
		}
	}
	return $stream;
}

sub toListByDate {
	my ($origstream, $condays) = @_;	
	my $stream = [sort {$a->{date} <=> $b->{date}} $origstream->items];
	my $basedate = DateTime->from_epoch(epoch=>$stream->[0]->{'date'})->to_julian;
	my @byDate;
	foreach my $item (@$stream) {
		my $to = DateTime->from_epoch(epoch=>$item->{'date'});
		$byDate[$to->to_julian - $basedate] = $item;
	}
	return \@byDate;
}


sub consistency {
	my ($origstream, $condays) = @_;
	$condays ||= 7;	
	my @WEIGHT = (0,1,3,3,2,2,2,2,2);
	
	my $stream = [sort {$a->{date} <=> $b->{date}} @$origstream];
	
	my $CONBACK = $condays * 24 * 60 * 60;
	my $sumcon = 0;
	
	for my $i (0..scalar(@$stream)-1) {
		my $item = $stream->[$i];
		my $back = $i-1;
		my $workouts = 0; # Workouts in period
		my $to = DateTime->from_epoch(epoch=>$item->{'date'});
		my $consistency = 1;
		$item->{'sincelast'} = 0;
		while ($back>=0 && $stream->[$back] && ($stream->[$back]->{'date'}+$CONBACK > $item->{'date'})) {
			my $from = DateTime->from_epoch(epoch=>$stream->[$back]->{'date'});
			my $delta = $to->delta_days($from)->days;
			$consistency += 1;# $WEIGHT[$delta];
			#print STDERR "Hit back $delta\n";
			my $old = $stream->[$back];
			if ($old->validPowerLift) {
				$item->{'sincelast'} ||= $delta;
				$workouts ++;
			}
			$back--;
		}
		#print STDERR "Since last $item->{'sincelast'}\n";
		
		$item->{'workouts'} = $workouts;
		$sumcon += $item->{'sincelast'} / 3;
		for (my $b=$i-1; $b>=$i-4; $b--) {
			
			if ($b>=0 && $stream->[$b]) {
				#print STDERR "$stream->[$b]->{date} - $stream->[$i]->{date}\n" unless defined $stream->[$b]->{'workouts'};
				$workouts += $stream->[$b]->{'workouts'};
				#print STDERR "Accumulate $stream->[$b]->{'workouts'}\n";
			}
		}
		$item->{'consistency'} = $workouts; #sprintf('%d', 10* ($workouts / 7) );
		$item->{'sumcon'} = $sumcon;
		
	}
}


sub movingMax {
	my ($origstream,  $perdays) = @_;
	$perdays ||=1;
	my $LOOKBACK= $perdays * 24 * 60 *60; # Days to secs
	
	my $stream = [sort {$a->{date} <=> $b->{date}} @$origstream];
	my %prev = (); #map {$_ => 0 } (@POWERLIFTS);
	for my $i (0..scalar(@$stream)-1) {
		my $item = $stream->[$i];
		my $back = $i-1;
		#print STDERR "Looking back from $item->{'date'} to $stream->[$back]->{'date'}\n";
		if ($perdays) {
			#my %permax = map { $_ => $item->maxFor($_) } (@POWERLIFTS);
			# Max will use previous max by induction
			my %permax = map { $_ => $item->maxFor($_) || $prev{$_} } (@POWERLIFTS);
			while ($back>=0 && $stream->[$back] && ($stream->[$back]->{'date'}+$LOOKBACK > $item->{'date'})) {
				my $old = $stream->[$back];
				
				foreach (@POWERLIFTS) {
					my $oldmax = $old->maxFor($_);
					if ($permax{$_} && $oldmax) {
						$permax{$_} = $permax{$_}< $oldmax ? $oldmax : $permax{$_}
					}
				}
				$back--;
			}
			$item->{'permax'} = \%permax;
			%prev = %permax;

			
		}
		else {
		}
		#print STDERR "$item->{date} $workouts\n";
	}
}


1