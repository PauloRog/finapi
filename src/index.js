const { request } = require('express');
const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
const customers = [];

app.use(express.json());

function verifyUserAccount(request, response, next) {
  const { cpf } = request.headers;
  const customer = customers.find(
    (customer) => customer.cpf === cpf
  )

  if (!customer) {
    return response.status(400).json({ message: 'Customer not found!'})
  }

  request.customer = customer;

  return next();
}

function getBalance(statement) {
  const balance = statement.reduce(
    (accumulator, operation) => {
      if (operation.type === 'credit') return accumulator + operation.amount;
      else return accumulator - operation.amount;
    }, 0);

  return balance;
}

app.post('/account', (request, response) => {
  const { cpf, name } = request.body;
  const customerAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  );

  if (customerAlreadyExists) {
    return response.status(400).json({ message: 'Customer already exists!' });
  }

  customers.push({
    id: uuidv4(),
    cpf,
    name,
    statement: []
  })

  return response.status(201).json({ message: 'Customer created success!' })
})

app.use(verifyUserAccount);

app.get('/statement', (request, response) => {
  const { customer } = request;

  return response.json(customer.statement);
})

app.post('/deposit', (request, response) => {
  const { description, amount } = request.body;
  const { customer } = request;
  const statementOperation = {
    description,
    amount,
    create_at: new Date(),
    type: 'credit',
  };

  customer.statement.push(statementOperation);

  return response.status(201).json({ message: 'Deposit made success!'});
})

app.post('/withdraw', (request, response) => {
  const { amount } = request.body;
  const { customer } = request;
  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return response.status(400).json({ message: 'Insufficient funds!' });
  };

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: 'debit',
  };

  customer.statement.push(statementOperation);

  return response.status(201).json({ message: 'Withdraw made success!' });
})

app.get('/statement/date', (request, response) => {
  const { customer } = request;
  const { date } = request.query;
  const dateFormat = new Date(date + ' 00:00');
  const statement = customer.statement.filter(
    (statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString
  );

  return response.json(statement);
})

app.put('/account', (request, response) => {
  const { name } = request.body;
  const { customer } = request;

  customer.name = name;

  return response.status(201).json({ message: 'Data updated success' });
})

app.get('/account', (request, response) => {
  const { customer } = request;

  return response.json(customer);
})

app.delete('/account', (request, response) => {
  const { customer } = request;

  customer.splice(customer, 1);

  return response.status(200).json('Customer delete success!');
})

app.listen(3333, () => {
  console.log('Server is runnig in port 3333')
})
