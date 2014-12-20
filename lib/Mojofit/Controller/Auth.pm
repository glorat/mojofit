package Mojofit::Controller::Auth;
use strict;
use warnings;

use Mojo::Base 'Mojolicious::Controller';


sub login {
	my $c = shift;
	eval {
		$c->app->log->debug("Trying to log in");
		my $json = $c->req->json;
		
	    my $email = lc($json->{'email'} || '');
	    my $pass = $json->{'password'} || '';
 
	    # Check password and render "index.html.ep" if necessary
$c->app->log->debug("Trying to log in $email");
	    return $c->render(json => {message=>'Failed to log in', level=>'warning', userStatus=>{} }) unless my $user = $c->users->check($c, $email, $pass);

	    # Store login in session
	    $c->session(email => $user->email, id=>$user->id, username=>$user->username);
		$c->session(expiration => 3600*24*30); # 30-days for now. Low security
	
	    # This should match what went into the session above!
		my $status = {isLoggedIn=>1, userPrefs=> undef, id=>$user->id, email=>$user->email, username=>$user->username}; #$user->{userPrefs}
		$c->app->log->debug("Logged in $email");
		$c->render(json=>{userStatus=>$status, level=>'success', message=>'Logged In!'});
	};
	if ($@) {
		$c->render(json=>{level=>'danger', message=>$@});
	}
}

sub register {
	my $c = shift;
	eval {
		my $ip = $c->tx->remote_address;
		my $param = $c->req->json;
		my $email = $param->{'email'}; # FIXME: detaint
		my $name = lc($param->{'firstname'}).' '.lc($param->{'lastname'}); # FIXME: detaint
		my $reg = {name=>$name, email=>$email, username=>$email}; # TODO:
		$c->dbic or die ("The database is down");
		my $user = $c->users->register($c->dbic, $reg);
		my $pass = $user->changepass;
		$c->render(json=>{level=>'success', message=>"Registration successful. Your password is $pass"});
	};
	if ($@) {
		$c->render(json=>{level=>'danger', message=>$@});
	}
}

sub nameToUsername {
	my ($db, $name) = @_;
	$name =~ s/\w//g; # Kill ws
	my $id = $db->resultset('Member')->search({})->get_column('id')->max()+1;
	return "$name.$id";
	
}

sub getUserStatus {
	my $c = shift;
	my $status = {};
	eval {
		if ($c->session('email')) {
			# Logged in
			my $email = $c->session('email');
			$status->{isLoggedIn} = 1;
			$status->{email} = $email;
			$status->{username} = $c->session('username');
			$status->{id} = $c->session('id');
			#$status->{userPrefs} = $user->{userPrefs};
		}
		else {
			$status->{isLoggedIn} = 0;
		}
	};
	
	if ($!) {
		$status->{error} = $_;
	}
	$c->render(json => $status);
};


1;