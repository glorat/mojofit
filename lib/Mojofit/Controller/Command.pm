package Mojofit::Controller::Command;
use strict;
use warnings;

use Mojo::Base 'Mojolicious::Controller';
use JSON -convert_blessed_universally;


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
		my $csrf = $c->req->headers->header('X-XSRF-TOKEN') // '';
		($csrf eq $c->csrf_token) or return $c->render(json=>{level=>'warning', message=>'CSRF attack foiled'});
		# Main handle here
		my $date = $json->{date};
		my $store = Fitstore->new($id);
		my $err = $store->check_delete($date);
		if ($err) {
			$c->render(json=>{level=>'warning', message=>$err});
			return;
		}
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

sub handle_submit_workouts {
	my ($c, $id, $json) = @_;
	my $items = $json->{items};
	# Put in event store
	my $name = $id;
	my $store = Fitstore->new($id);
	$store->submit_workouts($items);
}

sub submit_workouts {
	my $c = shift;
	$c->submit_any('handle_submit_workouts');
}

sub submit_weight {
	my ($c) = @_;
	$c->submit_any('handle_submit_weight');
}

sub submit_prefs {
	my ($c) = @_;
	$c->submit_any('handle_submit_prefs');
}


sub handle_submit_weight {
	my ($c, $id, $cmd) = @_;
	my $store = Fitstore->new($id);
	$store->submit_weight($cmd);
}

sub handle_submit_prefs {
	my ($c, $id, $cmd) = @_;
	
	my $store = Fitstore->new($id);
	$store->submit_prefs($cmd);
}

sub submit_any{
	my ($c, $handler) = @_;
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
		
		my $csrf = $c->req->headers->header('X-XSRF-TOKEN') // '';
		if ($csrf ne $c->csrf_token) {
			$c->app->log->warn("User $id failed CSRF check while performing $handler. Was given $csrf");
			return $c->render(json=>{level=>'warning', message=>'CSRF failure. Please report this error, refresh your page and try again'});	
		} 
		
		# Handle it
		my $ret = $c->$handler($id, $json);

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
	
		$c->render(json=>{level=>'success', message=>'Submitted successfully!', redirect_to=>"/user/$id"});
	};
	if ($@) {
		if ('Mojo::Exception' eq ref($@)) {
			$c->app->log->warn($@->message);
			$c->app->log->warn($@->frames);
			$c->render(json=>{level=>'danger', message=>$@->message});	
		}
		else {
			$c->render(json=>{level=>'danger', message=>$@});	
		}	
	}
}

sub crazy {
	my ($c) = @_;
	$c->app->log->info('Doing crazy stuff');
	eval {
		my $id = $c->session->{id};
		$id or die "You must be logged in at http://www.gainstrack.com\n";
		if ($id =~ m/^\d+$/) {
			# Tighter check for real users
			my $user = $c->users->get($c->dbic, $id);
			$user or die "Login no longer valid at gainstrack!!\n";
		}
		else {
			die("You must be a registered user at http://www.gainstrack.com\n")
		}
		my $isodate = $c->param('date');
		my $date = DateTime::Format::DateParse->parse_datetime($isodate, 'UTC')->epoch;
		my $stream = Mojofit::Stream::getStream($id);
		my @ones = grep {$_->{date} eq $date} (@$stream);
		my $one = $ones[0];
		$one or die ("Could not find your workout for $isodate ($date)\n");
		
		my $json = JSON->new->allow_blessed->convert_blessed;
		
		my $data = $json->encode($one);
		$c->stash('payload' => $data);
		$c->render(format=>'txt', type=>'application/javascript');
	};
	if ($@) {
		$@ =~ s/'/"/gs;
		$@ =~ s/\n//gs;
		$c->render(text=>"alert('Sorry, did not work: $@')", type=>'application/javascript');
	}
}

1;
