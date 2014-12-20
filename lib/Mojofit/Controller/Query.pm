package Mojofit::Controller::Query;
use strict;
use warnings;

use Mojo::Base 'Mojolicious::Controller';

sub getUserStatus {
	my $c = shift;
	my $status = {};
	eval {
		if ($c->session('email')) {
			# Logged in
			my $email = $c->session('email');
			$status->{isLoggedIn} = 1;
			$status->{email} = $email;
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