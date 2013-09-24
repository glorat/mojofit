#!/usr/bin/perl
use strict;
use warnings;
use WWW::Mechanize;
use JSON;
use Data::Dumper;
use IO::Socket::SSL;
use File::Util;
use DateTime;
my $m = WWW::Mechanize->new(autocheck=>0);
my($f) = File::Util->new();



my $js = <<END;
{"cols":[{"id":"","label":"","type":"date"},{"id":"","label":"SQ","type":"number"},{"id":"","label":"BP","type":"number"},{"id":"","label":"DL","type":"number"},{"id":"","label":"OP","type":"number"},{"id":"","label":"Row","type":"number"},{"id":"","label":"Body-Weight","type":"number"},{"id":"","label":"Body-Fat","type":"number"}],"rows":[{"c":[{"v":"Date(2012, 8, 04)"},{"v":86},{"v":57},{"v":null},{"v":null},{"v":64},{"v":68},{"v":7}]},{"c":[{"v":"Date(2012, 8, 06)"},{"v":61},{"v":null},{"v":102},{"v":48},{"v":null},{"v":68},{"v":7}]},{"c":[{"v":"Date(2012, 8, 09)"},{"v":79},{"v":54},{"v":null},{"v":null},{"v":64},{"v":68},{"v":8}]},{"c":[{"v":"Date(2012, 8, 11)"},{"v":61},{"v":null},{"v":104},{"v":43},{"v":null},{"v":68},{"v":8}]},{"c":[{"v":"Date(2012, 8, 13)"},{"v":84},{"v":57},{"v":null},{"v":null},{"v":66},{"v":68},{"v":8}]},{"c":[{"v":"Date(2012, 8, 16)"},{"v":82},{"v":57},{"v":null},{"v":null},{"v":66},{"v":68},{"v":8}]},{"c":[{"v":"Date(2012, 8, 18)"},{"v":61},{"v":null},{"v":107},{"v":43},{"v":null},{"v":68},{"v":8}]},{"c":[{"v":"Date(2012, 8, 20)"},{"v":84},{"v":57},{"v":null},{"v":null},{"v":66},{"v":68},{"v":8}]},{"c":[{"v":"Date(2012, 8, 23)"},{"v":84},{"v":57},{"v":null},{"v":null},{"v":66},{"v":68},{"v":8}]},{"c":[{"v":"Date(2012, 8, 25)"},{"v":64},{"v":null},{"v":109},{"v":45},{"v":null},{"v":68},{"v":8}]},{"c":[{"v":"Date(2012, 8, 27)"},{"v":86},{"v":59},{"v":null},{"v":null},{"v":68},{"v":68},{"v":8}]},{"c":[{"v":"Date(2012, 8, 30)"},{"v":75},{"v":59},{"v":null},{"v":null},{"v":68},{"v":68},{"v":8}]},{"c":[{"v":"Date(2012, 9, 02)"},{"v":null},{"v":null},{"v":102},{"v":45},{"v":null},{"v":68},{"v":8}]},{"c":[{"v":"Date(2012, 9, 04)"},{"v":88},{"v":59},{"v":null},{"v":null},{"v":68},{"v":68},{"v":8}]},{"c":[{"v":"Date(2012, 9, 07)"},{"v":88},{"v":59},{"v":null},{"v":null},{"v":68},{"v":69},{"v":8}]},{"c":[{"v":"Date(2012, 9, 09)"},{"v":null},{"v":null},{"v":104},{"v":48},{"v":null},{"v":69},{"v":8}]},{"c":[{"v":"Date(2012, 9, 11)"},{"v":91},{"v":61},{"v":null},{"v":null},{"v":68},{"v":69},{"v":8}]},{"c":[{"v":"Date(2012, 9, 14)"},{"v":91},{"v":59},{"v":null},{"v":null},{"v":61},{"v":69},{"v":8}]},{"c":[{"v":"Date(2012, 9, 16)"},{"v":null},{"v":null},{"v":104},{"v":48},{"v":null},{"v":69},{"v":8}]},{"c":[{"v":"Date(2012, 9, 18)"},{"v":91},{"v":61},{"v":null},{"v":null},{"v":61},{"v":69},{"v":8}]},{"c":[{"v":"Date(2012, 9, 21)"},{"v":91},{"v":61},{"v":null},{"v":null},{"v":61},{"v":68},{"v":7}]},{"c":[{"v":"Date(2012, 9, 23)"},{"v":null},{"v":null},{"v":107},{"v":50},{"v":null},{"v":68},{"v":7}]},{"c":[{"v":"Date(2012, 9, 25)"},{"v":93},{"v":61},{"v":null},{"v":null},{"v":52},{"v":68},{"v":7}]},{"c":[{"v":"Date(2012, 9, 28)"},{"v":93},{"v":61},{"v":null},{"v":null},{"v":54},{"v":67},{"v":7}]},{"c":[{"v":"Date(2012, 9, 30)"},{"v":null},{"v":null},{"v":107},{"v":50},{"v":null},{"v":67},{"v":7}]},{"c":[{"v":"Date(2012, 10, 01)"},{"v":95},{"v":61},{"v":null},{"v":null},{"v":57},{"v":67},{"v":7}]},{"c":[{"v":"Date(2012, 10, 04)"},{"v":95},{"v":61},{"v":null},{"v":null},{"v":59},{"v":68},{"v":7}]},{"c":[{"v":"Date(2012, 10, 06)"},{"v":null},{"v":null},{"v":109},{"v":50},{"v":null},{"v":68},{"v":7}]},{"c":[{"v":"Date(2012, 10, 08)"},{"v":95},{"v":64},{"v":null},{"v":null},{"v":61},{"v":68},{"v":7}]},{"c":[{"v":"Date(2012, 10, 11)"},{"v":95},{"v":64},{"v":null},{"v":null},{"v":61},{"v":68},{"v":7}]},{"c":[{"v":"Date(2012, 10, 13)"},{"v":null},{"v":null},{"v":111},{"v":50},{"v":null},{"v":68},{"v":7}]},{"c":[{"v":"Date(2012, 10, 15)"},{"v":98},{"v":64},{"v":null},{"v":null},{"v":61},{"v":68},{"v":7}]},{"c":[{"v":"Date(2012, 10, 18)"},{"v":98},{"v":64},{"v":null},{"v":null},{"v":61},{"v":68},{"v":7}]},{"c":[{"v":"Date(2012, 10, 20)"},{"v":null},{"v":null},{"v":111},{"v":50},{"v":null},{"v":68},{"v":7}]},{"c":[{"v":"Date(2012, 10, 22)"},{"v":100},{"v":64},{"v":null},{"v":null},{"v":61},{"v":68},{"v":7}]},{"c":[{"v":"Date(2012, 10, 27)"},{"v":null},{"v":null},{"v":102},{"v":50},{"v":null},{"v":68},{"v":8}]},{"c":[{"v":"Date(2012, 10, 29)"},{"v":100},{"v":59},{"v":null},{"v":null},{"v":61},{"v":68},{"v":8}]},{"c":[{"v":"Date(2012, 11, 02)"},{"v":88},{"v":54},{"v":null},{"v":null},{"v":64},{"v":67},{"v":7}]},{"c":[{"v":"Date(2012, 11, 04)"},{"v":null},{"v":null},{"v":104},{"v":50},{"v":null},{"v":67},{"v":7}]},{"c":[{"v":"Date(2012, 11, 06)"},{"v":88},{"v":57},{"v":null},{"v":null},{"v":64},{"v":67},{"v":7}]},{"c":[{"v":"Date(2012, 11, 09)"},{"v":91},{"v":57},{"v":null},{"v":null},{"v":64},{"v":68},{"v":8}]},{"c":[{"v":"Date(2012, 11, 11)"},{"v":null},{"v":null},{"v":107},{"v":48},{"v":null},{"v":68},{"v":8}]},{"c":[{"v":"Date(2012, 11, 13)"},{"v":91},{"v":57},{"v":null},{"v":null},{"v":64},{"v":68},{"v":8}]},{"c":[{"v":"Date(2012, 11, 16)"},{"v":79},{"v":59},{"v":null},{"v":null},{"v":66},{"v":68},{"v":8}]},{"c":[{"v":"Date(2012, 11, 19)"},{"v":null},{"v":null},{"v":107},{"v":48},{"v":null},{"v":68},{"v":8}]},{"c":[{"v":"Date(2012, 11, 21)"},{"v":null},{"v":59},{"v":null},{"v":null},{"v":66},{"v":68},{"v":8}]},{"c":[{"v":"Date(2012, 11, 24)"},{"v":null},{"v":61},{"v":null},{"v":null},{"v":66},{"v":68},{"v":8}]},{"c":[{"v":"Date(2012, 11, 26)"},{"v":null},{"v":null},{"v":107},{"v":49},{"v":null},{"v":68},{"v":8}]},{"c":[{"v":"Date(2012, 11, 28)"},{"v":null},{"v":61},{"v":null},{"v":null},{"v":66},{"v":68},{"v":8}]},{"c":[{"v":"Date(2012, 11, 30)"},{"v":null},{"v":null},{"v":107},{"v":49},{"v":null},{"v":69},{"v":8}]},{"c":[{"v":"Date(2013, 0, 02)"},{"v":null},{"v":61},{"v":null},{"v":null},{"v":66},{"v":69},{"v":8}]},{"c":[{"v":"Date(2013, 0, 05)"},{"v":null},{"v":null},{"v":109},{"v":50},{"v":null},{"v":69},{"v":8}]},{"c":[{"v":"Date(2013, 0, 07)"},{"v":null},{"v":61},{"v":null},{"v":null},{"v":68},{"v":68},{"v":7}]},{"c":[{"v":"Date(2013, 0, 09)"},{"v":null},{"v":null},{"v":null},{"v":50},{"v":null},{"v":68},{"v":7}]},{"c":[{"v":"Date(2013, 0, 11)"},{"v":20},{"v":61},{"v":null},{"v":null},{"v":null},{"v":68},{"v":7}]},{"c":[{"v":"Date(2013, 0, 14)"},{"v":null},{"v":null},{"v":102},{"v":50},{"v":null},{"v":68},{"v":7}]},{"c":[{"v":"Date(2013, 0, 16)"},{"v":25},{"v":61},{"v":null},{"v":null},{"v":61},{"v":68},{"v":7}]},{"c":[{"v":"Date(2013, 0, 18)"},{"v":null},{"v":null},{"v":102},{"v":50},{"v":null},{"v":68},{"v":8}]},{"c":[{"v":"Date(2013, 0, 23)"},{"v":27},{"v":54},{"v":null},{"v":null},{"v":61},{"v":68},{"v":8}]},{"c":[{"v":"Date(2013, 0, 28)"},{"v":null},{"v":null},{"v":102},{"v":48},{"v":null},{"v":68},{"v":8}]},{"c":[{"v":"Date(2013, 0, 30)"},{"v":null},{"v":54},{"v":102},{"v":null},{"v":61},{"v":67},{"v":8}]},{"c":[{"v":"Date(2013, 1, 01)"},{"v":null},{"v":null},{"v":102},{"v":48},{"v":null},{"v":67},{"v":8}]},{"c":[{"v":"Date(2013, 1, 04)"},{"v":null},{"v":57},{"v":102},{"v":null},{"v":61},{"v":68},{"v":8}]},{"c":[{"v":"Date(2013, 1, 06)"},{"v":43},{"v":null},{"v":107},{"v":48},{"v":null},{"v":68},{"v":8}]},{"c":[{"v":"Date(2013, 1, 08)"},{"v":48},{"v":57},{"v":null},{"v":null},{"v":61},{"v":68},{"v":8}]},{"c":[{"v":"Date(2013, 1, 11)"},{"v":52},{"v":null},{"v":107},{"v":48},{"v":null},{"v":68},{"v":8}]},{"c":[{"v":"Date(2013, 1, 13)"},{"v":57},{"v":57},{"v":null},{"v":null},{"v":64},{"v":68},{"v":8}]},{"c":[{"v":"Date(2013, 1, 15)"},{"v":61},{"v":null},{"v":107},{"v":49},{"v":null},{"v":68},{"v":8}]},{"c":[{"v":"Date(2013, 1, 18)"},{"v":64},{"v":59},{"v":null},{"v":null},{"v":64},{"v":67},{"v":8}]},{"c":[{"v":"Date(2013, 1, 20)"},{"v":66},{"v":null},{"v":107},{"v":49},{"v":null},{"v":67},{"v":8}]},{"c":[{"v":"Date(2013, 1, 22)"},{"v":70},{"v":59},{"v":null},{"v":null},{"v":66},{"v":67},{"v":8}]},{"c":[{"v":"Date(2013, 1, 25)"},{"v":73},{"v":null},{"v":107},{"v":48},{"v":null},{"v":68},{"v":8}]},{"c":[{"v":"Date(2013, 1, 27)"},{"v":75},{"v":59},{"v":null},{"v":null},{"v":66},{"v":68},{"v":8}]},{"c":[{"v":"Date(2013, 2, 01)"},{"v":77},{"v":null},{"v":109},{"v":49},{"v":null},{"v":68},{"v":8}]},{"c":[{"v":"Date(2013, 2, 04)"},{"v":79},{"v":61},{"v":null},{"v":null},{"v":66},{"v":68},{"v":8}]},{"c":[{"v":"Date(2013, 2, 06)"},{"v":82},{"v":null},{"v":111},{"v":49},{"v":null},{"v":68},{"v":8}]},{"c":[{"v":"Date(2013, 2, 08)"},{"v":82},{"v":61},{"v":null},{"v":null},{"v":66},{"v":68},{"v":8}]},{"c":[{"v":"Date(2013, 2, 11)"},{"v":82},{"v":null},{"v":116},{"v":50},{"v":null},{"v":67},{"v":7}]},{"c":[{"v":"Date(2013, 2, 13)"},{"v":84},{"v":64},{"v":null},{"v":null},{"v":59},{"v":67},{"v":7}]},{"c":[{"v":"Date(2013, 2, 15)"},{"v":84},{"v":null},{"v":116},{"v":51},{"v":null},{"v":67},{"v":7}]},{"c":[{"v":"Date(2013, 2, 18)"},{"v":87},{"v":64},{"v":null},{"v":null},{"v":61},{"v":67},{"v":8}]},{"c":[{"v":"Date(2013, 2, 20)"},{"v":86},{"v":null},{"v":116},{"v":51},{"v":null},{"v":67},{"v":8}]},{"c":[{"v":"Date(2013, 2, 22)"},{"v":86},{"v":66},{"v":null},{"v":null},{"v":61},{"v":67},{"v":8}]},{"c":[{"v":"Date(2013, 2, 25)"},{"v":88},{"v":null},{"v":116},{"v":51},{"v":null},{"v":67},{"v":8}]},{"c":[{"v":"Date(2013, 2, 27)"},{"v":88},{"v":66},{"v":null},{"v":null},{"v":61},{"v":67},{"v":8}]},{"c":[{"v":"Date(2013, 2, 29)"},{"v":88},{"v":null},{"v":120},{"v":52},{"v":null},{"v":68},{"v":8}]},{"c":[{"v":"Date(2013, 3, 01)"},{"v":91},{"v":66},{"v":null},{"v":null},{"v":61},{"v":68},{"v":8}]},{"c":[{"v":"Date(2013, 3, 03)"},{"v":93},{"v":null},{"v":102},{"v":52},{"v":null},{"v":68},{"v":8}]},{"c":[{"v":"Date(2013, 3, 05)"},{"v":93},{"v":68},{"v":null},{"v":null},{"v":64},{"v":68},{"v":8}]},{"c":[{"v":"Date(2013, 3, 08)"},{"v":95},{"v":null},{"v":120},{"v":52},{"v":null},{"v":68},{"v":8}]},{"c":[{"v":"Date(2013, 3, 14)"},{"v":93},{"v":61},{"v":null},{"v":null},{"v":61},{"v":68},{"v":8}]},{"c":[{"v":"Date(2013, 3, 16)"},{"v":95},{"v":null},{"v":102},{"v":54},{"v":null},{"v":68},{"v":8}]},{"c":[{"v":"Date(2013, 3, 21)"},{"v":61},{"v":null},{"v":null},{"v":null},{"v":null},{"v":68},{"v":8}]},{"c":[{"v":"Date(2013, 3, 22)"},{"v":95},{"v":61},{"v":null},{"v":null},{"v":64},{"v":68},{"v":8}]},{"c":[{"v":"Date(2013, 3, 24)"},{"v":98},{"v":null},{"v":102},{"v":54},{"v":null},{"v":68},{"v":8}]},{"c":[{"v":"Date(2013, 3, 26)"},{"v":98},{"v":64},{"v":null},{"v":null},{"v":64},{"v":68},{"v":8}]},{"c":[{"v":"Date(2013, 3, 29)"},{"v":102},{"v":null},{"v":107},{"v":54},{"v":null},{"v":68},{"v":8}]},{"c":[{"v":"Date(2013, 4, 01)"},{"v":86},{"v":64},{"v":null},{"v":null},{"v":64},{"v":68},{"v":8}]},{"c":[{"v":"Date(2013, 4, 03)"},{"v":88},{"v":null},{"v":111},{"v":49},{"v":null},{"v":68},{"v":8}]},{"c":[{"v":"Date(2013, 4, 06)"},{"v":91},{"v":64},{"v":null},{"v":null},{"v":66},{"v":68},{"v":8}]},{"c":[{"v":"Date(2013, 4, 08)"},{"v":61},{"v":null},{"v":111},{"v":50},{"v":null},{"v":68},{"v":8}]},{"c":[{"v":"Date(2013, 4, 10)"},{"v":93},{"v":64},{"v":null},{"v":null},{"v":64},{"v":68},{"v":8}]},{"c":[{"v":"Date(2013, 4, 13)"},{"v":20},{"v":null},{"v":116},{"v":51},{"v":null},{"v":68},{"v":8}]},{"c":[{"v":"Date(2013, 4, 15)"},{"v":20},{"v":57},{"v":null},{"v":null},{"v":66},{"v":68},{"v":8}]},{"c":[{"v":"Date(2013, 4, 17)"},{"v":20},{"v":null},{"v":120},{"v":52},{"v":null},{"v":68},{"v":8}]},{"c":[{"v":"Date(2013, 4, 20)"},{"v":84},{"v":59},{"v":null},{"v":null},{"v":66},{"v":68},{"v":8}]},{"c":[{"v":"Date(2013, 4, 22)"},{"v":86},{"v":null},{"v":125},{"v":52},{"v":null},{"v":68},{"v":8}]},{"c":[{"v":"Date(2013, 4, 24)"},{"v":88},{"v":61},{"v":null},{"v":null},{"v":66},{"v":68},{"v":8}]},{"c":[{"v":"Date(2013, 4, 27)"},{"v":91},{"v":null},{"v":111},{"v":52},{"v":null},{"v":68},{"v":8}]},{"c":[{"v":"Date(2013, 4, 29)"},{"v":93},{"v":64},{"v":null},{"v":null},{"v":66},{"v":69},{"v":8}]},{"c":[{"v":"Date(2013, 4, 31)"},{"v":95},{"v":null},{"v":111},{"v":52},{"v":null},{"v":69},{"v":8}]},{"c":[{"v":"Date(2013, 5, 03)"},{"v":95},{"v":66},{"v":null},{"v":null},{"v":68},{"v":69},{"v":8}]},{"c":[{"v":"Date(2013, 5, 05)"},{"v":98},{"v":null},{"v":116},{"v":46},{"v":null},{"v":69},{"v":8}]},{"c":[{"v":"Date(2013, 5, 07)"},{"v":100},{"v":66},{"v":null},{"v":null},{"v":68},{"v":70},{"v":8}]},{"c":[{"v":"Date(2013, 5, 10)"},{"v":102},{"v":null},{"v":120},{"v":48},{"v":null},{"v":71},{"v":9}]},{"c":[{"v":"Date(2013, 5, 12)"},{"v":104},{"v":68},{"v":null},{"v":null},{"v":68},{"v":71},{"v":9}]},{"c":[{"v":"Date(2013, 5, 14)"},{"v":104},{"v":null},{"v":125},{"v":49},{"v":null},{"v":71},{"v":9}]},{"c":[{"v":"Date(2013, 5, 17)"},{"v":104},{"v":68},{"v":null},{"v":null},{"v":70},{"v":71},{"v":9}]},{"c":[{"v":"Date(2013, 5, 19)"},{"v":111},{"v":null},{"v":125},{"v":50},{"v":null},{"v":71},{"v":9}]},{"c":[{"v":"Date(2013, 5, 21)"},{"v":93},{"v":75},{"v":null},{"v":null},{"v":70},{"v":71},{"v":9}]},{"c":[{"v":"Date(2013, 5, 24)"},{"v":93},{"v":null},{"v":129},{"v":51},{"v":null},{"v":70},{"v":9}]},{"c":[{"v":"Date(2013, 5, 26)"},{"v":95},{"v":68},{"v":null},{"v":null},{"v":70},{"v":70},{"v":9}]},{"c":[{"v":"Date(2013, 5, 28)"},{"v":98},{"v":null},{"v":116},{"v":52},{"v":null},{"v":70},{"v":9}]},{"c":[{"v":"Date(2013, 6, 01)"},{"v":100},{"v":61},{"v":null},{"v":null},{"v":70},{"v":69},{"v":8}]},{"c":[{"v":"Date(2013, 6, 03)"},{"v":102},{"v":null},{"v":102},{"v":54},{"v":null},{"v":69},{"v":8}]},{"c":[{"v":"Date(2013, 6, 05)"},{"v":104},{"v":64},{"v":null},{"v":null},{"v":70},{"v":69},{"v":8}]},{"c":[{"v":"Date(2013, 6, 08)"},{"v":107},{"v":null},{"v":107},{"v":53},{"v":null},{"v":70},{"v":8}]},{"c":[{"v":"Date(2013, 6, 10)"},{"v":107},{"v":66},{"v":null},{"v":null},{"v":70},{"v":70},{"v":8}]},{"c":[{"v":"Date(2013, 6, 12)"},{"v":109},{"v":null},{"v":111},{"v":53},{"v":null},{"v":70},{"v":8}]},{"c":[{"v":"Date(2013, 6, 15)"},{"v":111},{"v":68},{"v":null},{"v":null},{"v":73},{"v":70},{"v":8}]},{"c":[{"v":"Date(2013, 6, 17)"},{"v":111},{"v":null},{"v":116},{"v":53},{"v":null},{"v":70},{"v":8}]},{"c":[{"v":"Date(2013, 6, 19)"},{"v":113},{"v":68},{"v":null},{"v":null},{"v":73},{"v":70},{"v":8}]},{"c":[{"v":"Date(2013, 6, 22)"},{"v":102},{"v":61},{"v":102},{"v":45},{"v":null},{"v":69},{"v":8}]},{"c":[{"v":"Date(2013, 6, 24)"},{"v":61},{"v":54},{"v":84},{"v":null},{"v":61},{"v":69},{"v":8}]},{"c":[{"v":"Date(2013, 6, 26)"},{"v":102},{"v":70},{"v":102},{"v":48},{"v":null},{"v":69},{"v":8}]},{"c":[{"v":"Date(2013, 6, 28)"},{"v":102},{"v":70},{"v":125},{"v":52},{"v":null},{"v":69},{"v":8}]},{"c":[{"v":"Date(2013, 6, 30)"},{"v":84},{"v":61},{"v":84},{"v":null},{"v":null},{"v":70},{"v":8}]},{"c":[{"v":"Date(2013, 7, 01)"},{"v":null},{"v":null},{"v":null},{"v":57},{"v":null},{"v":69},{"v":8}]},{"c":[{"v":"Date(2013, 7, 04)"},{"v":107},{"v":70},{"v":125},{"v":null},{"v":null},{"v":70},{"v":8}]},{"c":[{"v":"Date(2013, 7, 06)"},{"v":null},{"v":null},{"v":null},{"v":45},{"v":null},{"v":70},{"v":8}]},{"c":[{"v":"Date(2013, 7, 08)"},{"v":102},{"v":66},{"v":null},{"v":null},{"v":73},{"v":70},{"v":8}]},{"c":[{"v":"Date(2013, 7, 10)"},{"v":null},{"v":null},{"v":132},{"v":59},{"v":null},{"v":70},{"v":8}]},{"c":[{"v":"Date(2013, 7, 12)"},{"v":null},{"v":null},{"v":null},{"v":45},{"v":null},{"v":70},{"v":8}]},{"c":[{"v":"Date(2013, 7, 14)"},{"v":86},{"v":null},{"v":null},{"v":null},{"v":null},{"v":70},{"v":8}]},{"c":[{"v":"Date(2013, 7, 16)"},{"v":null},{"v":43},{"v":null},{"v":null},{"v":43},{"v":71},{"v":8}]},{"c":[{"v":"Date(2013, 7, 17)"},{"v":null},{"v":null},{"v":100},{"v":null},{"v":null},{"v":71},{"v":8}]},{"c":[{"v":"Date(2013, 7, 19)"},{"v":null},{"v":null},{"v":null},{"v":48},{"v":null},{"v":71},{"v":8}]},{"c":[{"v":"Date(2013, 7, 21)"},{"v":93},{"v":null},{"v":null},{"v":null},{"v":null},{"v":71},{"v":8}]},{"c":[{"v":"Date(2013, 7, 23)"},{"v":null},{"v":45},{"v":null},{"v":null},{"v":45},{"v":71},{"v":8}]},{"c":[{"v":"Date(2013, 7, 24)"},{"v":null},{"v":null},{"v":107},{"v":null},{"v":null},{"v":71},{"v":8}]},{"c":[{"v":"Date(2013, 7, 26)"},{"v":null},{"v":null},{"v":null},{"v":50},{"v":null},{"v":71},{"v":9}]},{"c":[{"v":"Date(2013, 7, 28)"},{"v":98},{"v":null},{"v":null},{"v":null},{"v":null},{"v":71},{"v":9}]},{"c":[{"v":"Date(2013, 7, 30)"},{"v":null},{"v":48},{"v":null},{"v":null},{"v":48},{"v":71},{"v":9}]},{"c":[{"v":"Date(2013, 7, 31)"},{"v":70},{"v":null},{"v":111},{"v":null},{"v":null},{"v":71},{"v":9}]},{"c":[{"v":"Date(2013, 8, 02)"},{"v":91},{"v":43},{"v":null},{"v":null},{"v":null},{"v":71},{"v":9}]},{"c":[{"v":"Date(2013, 8, 04)"},{"v":null},{"v":null},{"v":66},{"v":57},{"v":null},{"v":71},{"v":9}]},{"c":[{"v":"Date(2013, 8, 06)"},{"v":64},{"v":59},{"v":null},{"v":null},{"v":null},{"v":72},{"v":9}]},{"c":[{"v":"Date(2013, 8, 07)"},{"v":null},{"v":null},{"v":104},{"v":null},{"v":43},{"v":72},{"v":9}]},{"c":[{"v":"Date(2013, 8, 09)"},{"v":95},{"v":45},{"v":null},{"v":null},{"v":null},{"v":72},{"v":10}]},{"c":[{"v":"Date(2013, 8, 11)"},{"v":null},{"v":null},{"v":68},{"v":50},{"v":null},{"v":72},{"v":10}]},{"c":[{"v":"Date(2013, 8, 13)"},{"v":70},{"v":64},{"v":null},{"v":null},{"v":null},{"v":72},{"v":10}]},{"c":[{"v":"Date(2013, 8, 14)"},{"v":null},{"v":null},{"v":111},{"v":null},{"v":45},{"v":72},{"v":10}]},{"c":[{"v":"Date(2013, 8, 16)"},{"v":120},{"v":50},{"v":null},{"v":null},{"v":null},{"v":72},{"v":10}]},{"c":[{"v":"Date(2013, 8, 18)"},{"v":null},{"v":null},{"v":70},{"v":52},{"v":null},{"v":72},{"v":10}]},{"c":[{"v":"Date(2013, 8, 20)"},{"v":75},{"v":75},{"v":null},{"v":null},{"v":null},{"v":73},{"v":11}]},{"c":[{"v":"Date(2013, 8, 21)"},{"v":null},{"v":null},{"v":125},{"v":null},{"v":null},{"v":72},{"v":11}]},{"c":[{"v":"Date(2013, 8, 23)"},{"v":61},{"v":52},{"v":null},{"v":null},{"v":null},{"v":73},{"v":11}]}]}
END

my $obj = decode_json($js);
my %SLICEXMAP = (''=>'date', 'SQ'=>'Barbell Squat', 'BP'=>"Barbell Bench Press", 'DL' => 'Barbell Deadlift', 'OP' => 'Standing Barbell Shoulder Press (OHP)', 'Row'=>'Pendlay Row');
my @headers = map {$SLICEXMAP{$_->{'label'}} || $_->{'label'}} (@{$obj->{'cols'}});
my @stream;
foreach my $row (@{$obj->{'rows'}}) {
	my %max = map {$headers[$_] => $row->{'c'}->[$_]->{'v'}} (0..scalar(@headers)-1);
	$max{'date'} =~ m/Date\((\d+), (\d+), (\d+)/;
	my $date = DateTime->new(year => $1, month=>$2+1, day=>$3)->epoch;
	push @stream, {'max'=>\%max, 'date'=>$date};
}

#print Dumper($obj->{'rows'});
print Dumper(\@stream);
print "\n";

my $jsonStream = encode_json(\@stream);
my $targetuser = '21018';
$f->write_file('file'=>"SLIC-$targetuser.json", 'content'=>$jsonStream);