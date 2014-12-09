package Mojofit::Model::Users;
 
use strict;
use warnings;
 
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
	$rec->{newpass} = $newpass = join '', map { $passchars[rand @passchars] } 0 .. 7;

	# FIXME: Call into db
	$USERS->{$rec->{$email}} = $rec;
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