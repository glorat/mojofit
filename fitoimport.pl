#!/usr/bin/perl
use strict;
use warnings;
use JSON;
use Data::Dumper;
use File::Util;
use Mojo::DOM;
use List::Util qw(first max maxstr min minstr reduce shuffle sum);
use List::MoreUtils qw(all);
use DateTime;
use DateTime::Format::DateParse;
use FindBin;
use lib "$FindBin::Bin/../lib";
use Fitstore;
$Fitstore::DATA_DIR = "$FindBin::Bin/data";

our($f) = File::Util->new();

our $targetuser = 'glorat';
our $mojouser = '1';
our $stream_increment = 15; # How much does fito show in one hit
our $STREAM_LIMIT = 2400; # That's plenty
#our $STREAM_LIMIT = 30; # That's good for testing
our $STASH_DIR = "$FindBin::Bin/../fitodata";


getFromStash();

sub getFromStash {
	my $stream_offset=0;
	my @streamItem;
	while ($stream_offset < $STREAM_LIMIT) {
		my $file = "$STASH_DIR/$targetuser-$stream_offset.html";
	
		if ($f->can_read($file)) {
			print STDERR "Processing from stashed $stream_offset\n";
			my $html = $f->load_file($file);
			my $dom = Mojo::DOM->new($html);
			processStream(\@streamItem, $dom);
		}
		else {
			last;
		}
		$stream_offset += $stream_increment;
	}
	my $jsonStream = encode_json(\@streamItem);
	
	# Put in event store
	my $store = Fitstore->new($mojouser);
	$store->submit_workouts(\@streamItem);
	
	my $view = Fitstore::MainView->new($mojouser);
	$view->write_by_date();
}

sub processStream {
	my ($streamItem, $dom) = @_;
	if ($dom->at("div.stream-inner-empty")) {
		print STDERR "No more items!";
		return;
	}
	
	
	$dom->find('div.stream_item')->each(sub {
		my $sitem = shift;
		my $date = DateTime::Format::DateParse->parse_datetime($sitem->at('a.action_time')->text);
		$date or next; # Today will break it 
		my @actions;
		foreach my $actEl ($sitem->find('ul.action_detail li')->each) {
			my $nameEl = $actEl->at('div.action_prompt');
			if ($nameEl) {
				print $date->ymd . " " . $nameEl->text . "\n";
				my @sets;
				foreach my $setEl ($actEl->at('ul')->find('li')->each) {
					#if ($setEl->children('span[class="action_prompt_points"]')->first) {
						# Only point worthy items are sets
						my $setText = $setEl->text;
						print STDERR "  ".$setEl->text."\n";
					#	print STDERR "***\n";
						push @sets, parseSetText($setText);
					#}
					#else {
					#	print STDERR "Commentary: ". $setEl->text;
					#	print STDERR "\n";
					#}
				}
				#print "\n";
				my $name = $nameEl->text;
				$name =~ s/:$//;
				push @actions, {name=> $name, sets=>\@sets} ;
			}
		}
		if (scalar (@actions)) {
			push @$streamItem, {actions=>\@actions, date=>$date->epoch, source => 'fitocracy'};
		}
	});
}


sub parseSetText {
	my $setText = shift;
	my %setData;
	if ($setText =~ m/([\d\.]+) kg/) {
		$setData{unit} = 'kg';
		$setData{weight} = $1;
	}
	elsif ($setText =~ m/([\d\.]+) lb/) {
		$setData{unit} = 'lb';
		$setData{weight} = $1;
		#$setData{kg} = sprintf('%.1f', $1 / 2.20462262185); # Fito rounding...
	}# else??
	
	if ($setText =~ m/([\d\.]+) reps/) {
		$setData{reps} = $1;
	}
	$setData{text} = $setText;
	return \%setData;
}


#sub Mojo::Collection::DESTROY {
#	# Nothing doing! Do not autoload call
#}
