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

sub delete_workout {
	my $c = shift;
	eval {
		# TODO: Put this in "under"
		my $json = $c->req->json;
		my $id = $c->session->{id};
		$id or die "Not logged in \n";
		if ($id =~ m/^\d+$/) {
			# Tighter check for real users
			my $user = $c->users->get($c->dbic, $id);
			$user or die "Login no longer valid!!\n";
		}
		# Main handle here
		my $date = $json->{date};
		my $store = Fitstore->new($id);
		$store->delete_workout($date);
		
		# Generate JSON view immediately
		my $view = Fitstore::MainView->new($id);
		$view->write_by_date();
		
		$c->render(json=>{level=>'success', message=>'Deleted succesfully!', redirect_to=>"/#/user/$id"});
	};
	if ($@) {
		$c->render(json=>{level=>'danger', message=>$@});
	}
}

sub submit_workouts {
	my $c = shift;
	eval {
		# TODO: Put this in "under"
		my $json = $c->req->json;
		my $id = $c->session->{id};
		$id or die "Not logged in \n";
		if ($id =~ m/^\d+$/) {
			# Tighter check for real users
			my $user = $c->users->get($c->dbic, $id);
			$user or die "Login no longer valid!!\n";
		}
		
		my $items = $json->{items};
		# Put in event store
		my $name = $id;
		my $store = Fitstore->new($id);
		$store->submit_workouts($items);
	
		# Generate JSON view immediately
		my $view = Fitstore::MainView->new($id);
		$view->write_by_date();
		
		# Generate symlink
		my $username = $c->session->{'username'};
		if (-f "$Mojofit::DATA_DIR/$username.json") {
			$c->app->log->warn("User $id $username cannot use link because blocked by existing file");
		}
		elsif (-l "$Mojofit::DATA_DIR/$username.json") {
			# Could check symlink is pointing to the right place...
		}
		else {
			$c->app->log->warn("Creating symlink for $username from his id $id");
			symlink("$Mojofit::DATA_DIR/$id.json", "$Mojofit::DATA_DIR/$username.json");
		}
	
		$c->render(json=>{level=>'success', message=>'Submitted successfully!', redirect_to=>"/#/user/$id"});
	};
	if ($@) {
		$c->render(json=>{level=>'danger', message=>$@});
	}
}


1;