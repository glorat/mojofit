package Mojofit::Controller::Auth;
use strict;
use warnings;

use Mojo::Base 'Mojolicious::Controller';
use WWW::Mailgun;
use Data::UUID;
use Fitstore;

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
		#$c->render(json=>{userStatus=>$status, level=>'success', message=>'Logged In!'});
		getUserStatus($c);
	};
	if ($@) {
		$c->render(json=>{level=>'danger', message=>$@});
	}
}

sub logout {
	my $c = shift;
	$c->session(expires => 1);	
	my $status = {isLoggedIn=>0, userPrefs=> undef, id=>'', email=>'', username=>''}; #$user->{userPrefs}
	$c->render(json=>{userStatus=>$status, level=>'success', message=>'Logged out!'});
}

sub register {
	my $c = shift;
	eval {
		my $ip = $c->tx->remote_address;
		my $param = $c->req->json;
		my $email = $param->{'email'}; # FIXME: detaint
		$param->{'lastname'} or die ("No lastname supplied\n");
		$param->{'firstname'} or die ("No firstname supplied\n");
		my $name = lc($param->{'firstname'}).' '.lc($param->{'lastname'}); # FIXME: detaint
		
		$c->dbic or die ("The database is down");
		
		if (my $user = $c->users->get_by($c->dbic, {name=>$name, email=>$email})) {
			# User supplies matching namd and email... sufficient weak auth
			if ($user->changepass) {
				# Password not changed, resend
				_send_password_email($c, $user);
				$c->render(json=>{level=>'success', message=>"Registration previously successful. Resending password to your email"});
				return;
			}
		}
		
		my $reg = {name=>$name, email=>$email, username=>$email}; # TODO:
		my $user = $c->users->register($c->dbic, $reg);
		if ($c->session('id')) {
			my $newid = $user->id;
			my $username = $user->username;
			# Clone into proper user
			Fitstore::clone($c->session('id'), $newid);
			# Set up symlink
			symlink("$Mojofit::DATA_DIR/$newid.json", "$Mojofit::DATA_DIR/$username.json");
		}
		
		my $pass = $user->changepass;
		_send_password_email($c, $user);
		$c->render(json=>{level=>'success', message=>"Registration successful. Any logs you made are imported. Your password is being emailed to you."});
	};
	if ($@) {
		$c->render(json=>{level=>'danger', message=>$@});
	}
}

sub changepass {
	my ($c) = @_;
	eval {
		my $json = $c->req->json;
		
	    my $oldpass = $json->{'oldpass'} || '';
		$oldpass or die ('No old password supplied, unless it was really blank');
	    my $newpass = $json->{'newpass'} || '';
		$oldpass or die ('No new password supplied, unless it was really blank');
 
		my $id = $c->session->{id};
		$id or die "Not logged in \n";
		if ($id !~ m/^\d+$/) {
			die ("Not logged in as registered user\n");
		}

		my $user = $c->users->changepass($c, $id, $oldpass, $newpass);
		$c->app->log->debug("User $id changed his password");
		$c->render(json=>{level=>'success', message=>'Password changed as requested!'});
	};
	if ($@) {

		$c->render(json=>{level=>'danger', message=>$@});
	}
}

sub _send_password_email {
	my ($c, $user) = @_;
	my $dispname = $user->dispname;
	my $email = $user->email;
	my $pass = $user->changepass;
	my $msg=<<END;
Dear $dispname,
	
Here are your login details.

Email: $email
Password: $pass

The website is still in early beta. You can change your password at http://www.gainstrack.com/login

To see the latest news on developments, please visit http://blog.gainstrack.com

Thanks,

Kevin
END

# FIXME: This can be slow. Do it in background, or async etc.
	# FIXME: Injection attack possible here??
	my %mail = ( to      =>  qq("$dispname" <$email>),
		     bcc     => 'kevin@glorat.net',
		     from    => 'Kevin Tam <kevin@glorat.net>',
		     subject => 'Gainstrack training log password retrieval',
		     text => $msg,
		     );
			 # This will die on failure
			 if ($c->app->mode eq 'test') {
				 $c->app->log->warn('NOT sending an email because in a test');
			 }
			 else {
				 $c->mg->send(\%mail);
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
	my $msg = {level=>'success', message=>'', userStatus=>$status, csrfToken => $c->csrf_token};
	eval {
		if (!$c->session('id')) {
			my $id = genId();
		    $c->session(id=>$id, username=>$id);
			$c->session(expiration => 3600*24*30); # 30-days for now
		}
		# Set CSRF token 
		#$c->cookie('XSRF-TOKEN' => $c->csrf_token, {path => '/'});
		
		my $id = $c->session('id');
		if ($id =~ m/^\d+$/) {
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
			$status->{id} = $id;
			$status->{username} = $id;
		    
		}
		# How many log entries do we have?
		$status->{revision} = Fitstore::MainView::get_revision($id) || 0;
	};
	
	if ($@) {
                $c->app->log->warn("getUserStatus crashed with $@");

		$status->{level} = 'warning';
		$status->{message} = $@;
	}
	$c->render(json => $msg);
};

sub genId {
	my $ug = new Data::UUID;
	my $uuid = $ug->create();
	return lc($ug->to_string( $uuid ));
}


1;
