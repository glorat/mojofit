package Mojofit::Controller::Command;
use strict;
use warnings;

use Mojo::Base 'Mojolicious::Controller';

sub jsonAuthenticated {
	my $c = shift;
	eval {
		if ($c->session('email')) {
			return 1;
		}
		else {
			$c->render(json => {message=>'Not logged in', level=>'warning'});
			return undef;
		}
	}
}


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
	    $c->session(email => $user->email, id=>$user->id);
		$c->session(expiration => 3600*24*30); # 30-days for now. Low security
	
		my $status = {isLoggedIn=>1, userPrefs=> undef}; #$user->{userPrefs}
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

sub submit_workouts {
	my $c = shift;
	eval {
		my $json = $c->req->json;
		my $id = $c->session->{id};
		$id or die "Not logged in \n";
		my $items = $json->{items};
		# Put in event store
		my $name = $id;
		my $store = Fitstore->new($id);
		$store->submit_workouts($items);
	
		my $view = Fitstore::MainView->new($id);
		$view->write_by_date();
	
		# TODO: Run a view to give some feedback :)
		$c->render(json=>{level=>'success', message=>'Submitted successfully!', redirect_to=>"/#/user/$id"});
	};
	if ($@) {
		$c->render(json=>{level=>'danger', message=>$@});
	}
}


1;