use Test::More;
use Test::Mojo;

# Load application class
my $t = Test::Mojo->new('Mojofit');
$t->ua->max_redirects(1);

$t->get_ok('/')
  ->status_is(200);

$t->post_ok('/command/register' => form => {firstname => 'kevin', lastname=>'tam', email => 'kevin@glorat.net'})
  ->status_is(200);

done_testing();