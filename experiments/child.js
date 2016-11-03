process.on('message', (m) => {
  console.log('CHILD got message:', m);
});

const interval = setInterval(()=>{
	process.send({ foo: 'bar' });
}, 1000)
