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