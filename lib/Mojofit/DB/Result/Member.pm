use utf8;
package Mojofit::DB::Result::Member;

# Created by DBIx::Class::Schema::Loader
# DO NOT MODIFY THE FIRST PART OF THIS FILE

=head1 NAME

Mojofit::DB::Result::Member

=cut

use strict;
use warnings;

use base 'DBIx::Class::Core';

=head1 TABLE: C<member>

=cut

__PACKAGE__->table("member");

=head1 ACCESSORS

=head2 id

  data_type: 'integer'
  is_auto_increment: 1
  is_nullable: 0

=head2 username

  data_type: 'varchar'
  default_value: (empty string)
  is_nullable: 0
  size: 100

=head2 name

  data_type: 'varchar'
  default_value: (empty string)
  is_nullable: 0
  size: 100

=head2 password

  data_type: 'varchar'
  default_value: (empty string)
  is_nullable: 0
  size: 32

=head2 email

  data_type: 'varchar'
  is_nullable: 1
  size: 50

=head2 dob

  data_type: 'date'
  datetime_undef_if_invalid: 1
  is_nullable: 1

=head2 gender

  data_type: 'char'
  default_value: (empty string)
  is_nullable: 0
  size: 1

=head2 changepass

  data_type: 'varchar'
  default_value: (empty string)
  is_nullable: 0
  size: 10

=cut

__PACKAGE__->add_columns(
  "id",
  { data_type => "integer", is_auto_increment => 1, is_nullable => 0 },
  "username",
  { data_type => "varchar", default_value => "", is_nullable => 0, size => 100 },
  "name",
  { data_type => "varchar", default_value => "", is_nullable => 0, size => 100 },
  "password",
  { data_type => "varchar", default_value => "", is_nullable => 0, size => 32 },
  "email",
  { data_type => "varchar", is_nullable => 1, size => 50 },
  "dob",
  { data_type => "date", datetime_undef_if_invalid => 1, is_nullable => 1 },
  "gender",
  { data_type => "char", default_value => "", is_nullable => 0, size => 1 },
  "changepass",
  { data_type => "varchar", default_value => "", is_nullable => 0, size => 10 },
);

=head1 PRIMARY KEY

=over 4

=item * L</id>

=back

=cut

__PACKAGE__->set_primary_key("id");

=head1 UNIQUE CONSTRAINTS

=head2 C<email>

=over 4

=item * L</email>

=back

=cut

__PACKAGE__->add_unique_constraint("email", ["email"]);

=head2 C<username>

=over 4

=item * L</username>

=back

=cut

__PACKAGE__->add_unique_constraint("username", ["username"]);


# Created by DBIx::Class::Schema::Loader v0.07042 @ 2014-12-19 14:34:21
# DO NOT MODIFY THIS OR ANYTHING ABOVE! md5sum:Nc3QUyy/NoKwDm7xO6zaDg


# You can replace this text with custom code or comments, and it will be preserved on regeneration
1;
