create database mojofit;
create database mojofit_dev;
create database mojofit_test;
create user mojofit identified by 'mojoglobal';
grant all on mojofit.* to mojofit;
grant all on mojofit_dev.* to mojofit;
grant all on mojofit_test.* to mojofit;
