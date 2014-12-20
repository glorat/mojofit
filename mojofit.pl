#!/usr/bin/perl
use FindBin;
use lib "$FindBin::Bin/lib";
use strict;

require Mojolicious::Commands;
Mojolicious::Commands->start_app('Mojofit');
