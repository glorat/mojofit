use utf8;
package Mojofit::DB::Result::AuditLog;

# Created by DBIx::Class::Schema::Loader
# DO NOT MODIFY THE FIRST PART OF THIS FILE

=head1 NAME

Mojofit::DB::Result::AuditLog

=cut

use strict;
use warnings;

use base 'DBIx::Class::Core';

=head1 TABLE: C<audit_log>

=cut

__PACKAGE__->table("audit_log");

=head1 ACCESSORS

=head2 id

  data_type: 'integer'
  is_auto_increment: 1
  is_nullable: 0

=head2 member

  data_type: 'integer'
  default_value: 0
  is_nullable: 0

=head2 resource

  data_type: 'varchar'
  default_value: (empty string)
  is_nullable: 0
  size: 20

=head2 resid

  data_type: 'integer'
  default_value: 0
  is_nullable: 0

=head2 field

  data_type: 'varchar'
  is_nullable: 1
  size: 20

=head2 oldval

  data_type: 'varchar'
  is_nullable: 1
  size: 255

=head2 newval

  data_type: 'varchar'
  is_nullable: 1
  size: 255

=head2 updated

  data_type: 'timestamp'
  datetime_undef_if_invalid: 1
  default_value: current_timestamp
  is_nullable: 0

=cut

__PACKAGE__->add_columns(
  "id",
  { data_type => "integer", is_auto_increment => 1, is_nullable => 0 },
  "member",
  { data_type => "integer", default_value => 0, is_nullable => 0 },
  "resource",
  { data_type => "varchar", default_value => "", is_nullable => 0, size => 20 },
  "resid",
  { data_type => "integer", default_value => 0, is_nullable => 0 },
  "field",
  { data_type => "varchar", is_nullable => 1, size => 20 },
  "oldval",
  { data_type => "varchar", is_nullable => 1, size => 255 },
  "newval",
  { data_type => "varchar", is_nullable => 1, size => 255 },
  "updated",
  {
    data_type => "timestamp",
    datetime_undef_if_invalid => 1,
    default_value => \"current_timestamp",
    is_nullable => 0,
  },
);

=head1 PRIMARY KEY

=over 4

=item * L</id>

=back

=cut

__PACKAGE__->set_primary_key("id");


# Created by DBIx::Class::Schema::Loader v0.07042 @ 2014-12-11 14:32:39
# DO NOT MODIFY THIS OR ANYTHING ABOVE! md5sum:w7xThRztMi4wrhdemNboww


# You can replace this text with custom code or comments, and it will be preserved on regeneration
1;
