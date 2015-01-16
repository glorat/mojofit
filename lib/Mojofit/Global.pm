use strict;
use warnings;

package Mojofit::Global;

BEGIN
{
    use Exporter ();
    use vars qw(@ISA @EXPORT @EXPORT_OK $VERSION);
    $VERSION = '1.0';
    @ISA = qw (Exporter);
    @EXPORT_OK = qw|&read_file &write_file|;
}


sub read_file {
	my ($filename, $encoding) = @_;
	$encoding ||= '';
	my $content;
	my $mode = "<$encoding";
	#$mode = '<';
	#die $mode;
    open(my $fh, $mode, $filename) or die "cannot open file $filename : $_";
    {
        local $/;
        $content = <$fh>;
    }
    close($fh);
	return $content;
}

sub write_file {
	my ($filename, $string) = @_;
    open(my $fh, '>', $filename) or die "Could not open file '$filename' $!";
	print $fh $string;
	close ($fh);
	return;
}

1;