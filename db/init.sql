create database mojofit;
create database mojofit_dev;
create user mojofit identified by 'mojoglobal';
grant all on mojofit.* to mojofit;
grant all on mojofit.* to mojofit_dev;
