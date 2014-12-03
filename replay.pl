#!/usr/bin/perl
use FindBin;
use lib "$FindBin::Bin/lib";
use strict;

use File::Util;
use Data::Dumper;
use Mojo::DOM;
use List::Util qw(first max maxstr min minstr reduce shuffle sum);
use List::MoreUtils qw(all);
use JSON; 

use Mojofit;
use Fitstore;

our $DATA_DIR = "$FindBin::Bin/data";
$Fitstore::DATA_DIR = $DATA_DIR;
$Mojofit::DATA_DIR = $DATA_DIR;

# Util objects
our($f) = File::Util->new();


sub main {
	opendir(DIR, $DATA_DIR) or die $!;

	while (my $file = readdir(DIR)) {
	    next unless (-f "$DATA_DIR/$file");
		if ($file =~ m/^([\w]+).dat$/) {
			replay($1);
		}
	}
	closedir(DIR);
}


sub replay {
	my ($name) = @_;
	print STDERR "Regenerating $name\n";
	my $view = Fitstore::MainView->new($name);
	$view->write_by_date();
	
}

main();
	