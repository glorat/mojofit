--
-- Table structure for table `audit_log`
--

DROP TABLE IF EXISTS `audit_log`;
CREATE TABLE `audit_log` (
  `id` int(11) NOT NULL auto_increment,
  `member` int(11) NOT NULL default '0',
  `resource` varchar(20) NOT NULL default '',
  `resid` int(11) NOT NULL default '0',
  `field` varchar(20) default NULL,
  `oldval` varchar(255) default NULL,
  `newval` varchar(255) default NULL,
  `updated` timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB;

--
-- Table structure for table `member`
--

DROP TABLE IF EXISTS `member`;
CREATE TABLE `member` (
  `id` int(11) NOT NULL auto_increment,
  `username` varchar(100) NOT NULL default '',
  `name` varchar(100) NOT NULL default '',
  `password` varchar(32) NOT NULL default '',
  `email` varchar(50) default NULL,
  `dob` date default NULL,
  `gender` char(1) NOT NULL default '',
  `changepass` varchar(10) NOT NULL default '',
  PRIMARY KEY  (`id`),
  KEY `name` (`name`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB ;


