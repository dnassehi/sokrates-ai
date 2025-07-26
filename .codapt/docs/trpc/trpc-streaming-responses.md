You can create a procedure that streams multiple values with:

```
const someProcedure = baseProcedure.query(async function* () {
  for (let i = 0; i < 3; i++) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    yield {
      // any kind of json-compatible object
      value: i,
      squaredValue: i * i,
      isGreaterThanTen: i > 10,
      stringifiedSquare: JSON.stringify(i * i),
    };
  }
});
```

Then, on the React client side, `myQuery.data` will be an array of all the data received so far (including previous values).
