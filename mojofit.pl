#!/usr/bin/perl
use FindBin;
use lib "$FindBin::Bin/lib";
use strict;

our $DATA_DIR = "$FindBin::Bin/data";
$Fitstore::DATA_DIR = $DATA_DIR;
$Mojofit::DATA_DIR = $DATA_DIR;

require Mojolicious::Commands;
Mojolicious::Commands->start_app('Mojofit');
