package Mojofit::Model::Users;
 
use strict;
use warnings;
 
use Mojo::Base -base;
 
use Crypt::PBKDF2;
use Data::Dumper;

my $pbkdf2 = Crypt::PBKDF2->new(
hash_class => 'HMACSHA2',
hash_args => {
	sha_size => 512,
},
iterations => 10000,
salt_len => 10,
);
 
sub new { bless {}, shift }
 
sub check {
  my ($self, $c, $email, $pass) = @_;
  my $rec = $c->dbic->resultset('Member')->find({email=>$email});

  if (!$rec) {
	  $c->app->log->warn("Failed lookup for $email");
	  return undef;
  }
  elsif ($rec->changepass eq $pass) {
	  $c->app->log->warn("Successful insecure login for $email");
	  return $rec;
  }
  elsif ($pbkdf2->validate($rec->password, $pass)) {
	  $c->app->log->info("Successful login for $email");
	  return $rec;
  }
  else {
	  # Fail
	  $c->app->log->warn("Failed password for $email $pass");
	  return undef;
  }

}

sub register {
	my ($self, $db, $rec) = @_;
	
	$rec->{email} or die "email must not be blank\n";
	$rec->{name} or die "name must not be blank\n";
	$rec->{name} =~ m/^\w[\w\ ]+\w$/ or die "name contains invalid characters\n";
	foreach (qw(email name)) {$rec->{$_} = lc($rec->{$_})}
	
	# TODO: Validate emails
	my @passchars = grep !/[0O1Iil]/, 0..9, 'A'..'Z', 'a'..'z';
	$rec->{changepass} = join '', map { $passchars[rand @passchars] } 0 .. 7;

	my $preexist = $db->resultset('Member')->search({email=>$rec->{email}})->first;
	die ("A user with that email already exists $rec->{email}\n") if ($preexist);

	#my $collection = $self->db->collection('visitors');
	my $res = $db->resultset('Member')->create($rec);
	my $dname = mk_username($rec->{name});
	eval {
		$res->update({username => $dname});	
	};
	if ($@) {
		$res->update({username=> $dname.'.'.$res->id});
	} 
	
	return $res;
}

sub changepass {
	my ($self, $c, $id, $oldpass, $newpass) = @_;
	# Assumes, we are already logged in correctly
	my $user = $self->get($c->dbic, $id);
	$user or die ("User $id not found for changepass\n");
	if ($user->changepass eq $oldpass) {
		$c->app->log->info("User $id is resetting his insecure password for a secure one");
		my $hash = $pbkdf2->generate($newpass);
		$user->update({changepass=>'', password=>$hash});
		return $user;
	}
	elsif ($user->changepass) {
		my $act = $user->changepass;
		$c->app->log->warn("User could not change insecure password. Supplied: $oldpass Expected: $act");
		die ("Incorrect password. Please check your email again\n");
	}
	elsif ($pbkdf2->validate($user->password, $oldpass)) {
		$c->app->log->info("User $id is changing his secure password");
		my $hash = $pbkdf2->generate($newpass);
		$user->update({changepass=>'', password=>$hash});
		return $user;
	}
	else {
		die ("Incorrect password. Please try again");
	}
}

sub get {
	my ($self, $db, $id) = @_;
	return $db->resultset('Member')->search({id=>$id})->first;
}

sub get_by {
	my ($self, $db, $where) = @_;
	return $db->resultset('Member')->search($where)->first;
}

sub mk_username
{
    my $s = shift;
    $s =~ s/(\w+)/\u\L$1/g;
	$s =~ s/\s//g;
    return $s;
}


package Mojofit::Model::User;
sub new {
	my ($self, $class) = shift;
	bless $self, $class;
}

sub mcase
{
    my $s = shift;
    $s =~ s/(\w+)/\u\L$1/g;
    return $s;
}

1;