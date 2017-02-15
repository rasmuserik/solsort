if [ ! -e node_modules/.bin/live-server ]; then npm install --save-dev live-server eslint uglify-js-harmony; npm install; fi

./node_modules/.bin/live-server --no-browser --ignore=node_modules &
echo $! > .pid-live-server

(sleep 3; touch solsort.js) &
while inotifywait -e modify,close_write,move_self -q *.js
do 
  kill `cat .pid`
  sleep 0.1
  node solsort.js test $@ &
  echo $! > .pid
  cat solsort.js | sed -e 's/^/    /' | sed -e 's/^ *[/][/] \?//' > README.md
  ./node_modules/.bin/eslint solsort.js &
  ./node_modules/.bin/uglifyjs -c 'pure_funcs=["da.test"]' < solsort.js > solsort.min.js 2> /dev/zero &
  sleep 3
done

