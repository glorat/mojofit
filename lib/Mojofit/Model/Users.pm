package Mojofit::Model::Users;
 
use strict;
use warnings;
 
use Crypt::PBKDF2;
my $pbkdf2 = Crypt::PBKDF2->new(
hash_class => 'HMACSHA2',
hash_args => {
	sha_size => 512,
},
iterations => 10000,
salt_len => 10,
);
 
my $USERS = {
  joel      => 'las3rs',
  marcus    => 'lulz',
  sebastian => 'secr3t'
};
 
sub new { bless {}, shift }
 
sub check {
  my ($self, $email, $pass) = @_;
 
 
  # Success
  return 1 if $USERS->{$email} && $USERS->{$email} eq $pass;
 
  # Fail
  return undef;
}
 
sub get {
	my ($self, $user) = @_;
	return Mojofit::Model::User->new($USERS->{$user});
}

sub register {
	my ($self, $rec) = @_;
	
	$rec->{email} or die 'email must not be blank\n';
	$rec->{firstname} or die "firstname must not be blank\n";
	$rec->{lastname} or die "lastname must not be blank\n";
	$rec->{firstname} =~ m/^\w[\w\ ]+\w$/ or die "firstname contains invalid characters\n";
	$rec->{lastname} =~ m/^\w[\w\ ]+\w$/ or die "lastname contains invalid characters\n";
	foreach (qw(email firstname lastname)) {$rec->{$_} = lc($rec->{$_})}
	
	# TODO: Validate emails
	my @passchars = grep !/[0O1Iil]/, 0..9, 'A'..'Z', 'a'..'z';
	$rec->{changepass} = $newpass = join '', map { $passchars[rand @passchars] } 0 .. 7;

	#my $collection = $self->db->collection('visitors');
	my($stmt, @bind) = $sql->insert('member', \%rec);
	my $sth = $self->db->prepare($stmt);
	$sth->execute(@bind);
}


 
sub recoverPassword {
    my ($self, $email) = @_;
	

    my $rec = $c->db->select_one_to_hashref ({
	fields => 'id,email,password', 
	table=>'member',
	where => {email=> $email}});

    if ($rec)
    {
	my @passchars = grep !/[0O1Iil]/, 0..9, 'A'..'Z', 'a'..'z';
	my $newpass = join '', map { $passchars[rand @passchars] } 0 .. 7;
	$c->db->update ('member',{changepass=>$newpass},{id=> $rec->{'id'}});
	$rec->{'dispname'} = Running::Global::mcase($rec->{'name'});
	$c->stash->{'user'} = $user;
	$c->stash->{'password'} = $newpass;
        my $tdata = {username=>$user, password=>$newpass};
	my $template = 'mail/msg/getpassword';
	my $msg = $c->view->render($c, $template, $tdata);

	my %mail = ( To      => "\"$rec->{'dispname'}\" <$rec->{'email'}>",
		     Bcc     => 'kevin@glorat.net',
		     From    => 'Kevin Tam <kevin@glorat.net>',
		     Subject => 'Membership password retrieval',
		     Message => $msg,
		     );
	
	if (!sendmail (%mail)) {
	    my $msg = "Could not send email: $Mail::Sendmail::error;";
	    $c->log->warn($msg);
	    return $c->stash('content'=>$msg, template=>'getpassword');
	}
	my $body = 'Your account has been found and your password has been emailed to you. It should arrive shortly.<br /><a href="/running/login">Return to login page</a>';
	$c->stash ( {content=>$body, template=>'glorat.html'} );

    }
    else
    {
	$c->stash ({template=> 'getpassword', statustext=> "That account was not found. You will need to have supplied your email to get a password"});
    }

}


package Mojofit::Model::User;
sub new {
	my ($self, $class) = shift;
	bless $self, $class;
}

sub dispname {
	my ($self) = @_;
	return mcase($self->{firstname}).' '.mcase($self->{lastname});
}

sub mcase
{
    my $s = shift;
    $s =~ s/(\w+)/\u\L$1/g;
    return $s;
}

1;