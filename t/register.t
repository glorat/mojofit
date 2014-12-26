use Test::More;
use Test::Mojo;

use FindBin;
use Data::Dumper;

$ENV{'MOJO_MODE'} = 'test';

# Load application class
my $t = Test::Mojo->new('Mojofit');

my $app = $t->ua->server->app;
my $mode = $app->mode;
is ($mode, 'test', 'testing mode');
$app->dbic->resultset('Member')->delete();
is (0,$app->dbic->resultset('Member')->count(),'start with empty member db');


$t->ua->max_redirects(1);

$t->get_ok('/')
  ->status_is(200);

  my $reg = {firstname => 'kevin', lastname=>'tam', email => 'glorat+test1@gmail.com'};
  my $reg2 = {firstname => 'kevin', lastname=>'tam2', email => 'glorat+test1@gmail.com'};
  my $reg3 = {firstname => 'kevin', lastname=>'tam', email => 'glorat+test2@gmail.com'};
  
  $t->post_ok('/auth/getUserStatus')
  ->status_is(200)
  ->json_is('/isLoggedIn' => 0)
  ->json_has('/id');
  my $id = $t->tx->res->json->{id};

  $t->post_ok('/auth/register' => form => $reg)
  ->status_is(200)
  ->json_is('/level' => 'danger', 'action form register should receive error');

  $t->post_ok('/auth/register' => json => $reg)
  ->status_is(200)
  ->json_is('/level' => 'success', 'register should succeed'. Dumper($t->tx->res->json))
  ->json_like('/message' => qr'Registration successful');

  $t->post_ok('/auth/register' => json => $reg)
  ->status_is(200)
  ->json_is('/level' => 'success', 'reregister should succeed'. Dumper($t->tx->res->json))
  ->json_like('/message' => qr'Resending password');

  
  $t->post_ok('/auth/register' => json => $reg2)
  ->status_is(200)
  ->json_is('/level' => 'danger', 'same email, diff name should fail'. Dumper($t->tx->res->json))
  ->json_like('/message' => qr'user with that email already exists');

  $t->post_ok('/auth/register' => json => $reg3)
  ->status_is(200)
  ->json_is('/level' => 'success', 'register with same name but other email should ok'. Dumper($t->tx->res->json))
  ->json_like('/message' => qr'Registration successful');
  
  my $user = $app->dbic->resultset('Member')->find({email=>$reg->{email}});
  $t->post_ok('/auth/login' => json => {email=>$reg->{email}, password=>'Wrong password'})
  ->status_is(200)
  ->json_is('/level'=>'warning')
  ->json_like('/message' => qr'Failed to log');

  $t->post_ok('/auth/login' => json => {email=>$reg->{email}, password=>$user->changepass})
  ->status_is(200)
  ->json_is('/level'=>'success')
  ->json_like('/message' => qr'Logged In');

  $t->get_ok('/auth/getUserStatus')
  ->status_is(200)
  ->json_is('/isLoggedIn' => 1)
  ->json_is('/username' => 'KevinTam')
  ->json_like('/id', qr'^\d+$');
  my $regid = $t->tx->res->json->{id};
done_testing();