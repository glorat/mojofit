mkdir data
mkdir data/userjson
cd client
bower install
grunt build
cd ..
./replay.pl
