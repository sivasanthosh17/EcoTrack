import test from 'node:test';
import assert from 'node:assert/strict';
import {
  authorize,
  canAccessDepartment,
  enforceDepartmentScope
} from '../middleware/authMiddleware.js';

const runMiddleware = (middleware, req) => {
  const response = {
    statusCode: null,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };
  let nextCalled = false;

  middleware(req, response, () => {
    nextCalled = true;
  });

  return { response, nextCalled };
};

test('organization admins pass admin authorization', () => {
  const result = runMiddleware(authorize('Organization Admin'), {
    user: { role: 'Organization Admin' }
  });

  assert.equal(result.nextCalled, true);
  assert.equal(result.response.statusCode, null);
});

test('department officers cannot pass admin authorization', () => {
  const result = runMiddleware(authorize('Organization Admin'), {
    user: { role: 'Department Officer' }
  });

  assert.equal(result.nextCalled, false);
  assert.equal(result.response.statusCode, 403);
});

test('officers are restricted to their own department', () => {
  const result = runMiddleware(enforceDepartmentScope, {
    method: 'GET',
    query: {},
    body: {},
    user: { role: 'Department Officer', department: 'Facilities & Energy' }
  });

  assert.equal(result.nextCalled, true);
  assert.equal(result.response.statusCode, null);
  assert.equal(result.response.payload, null);
});

test('cross-department requests are rejected', () => {
  const result = runMiddleware(enforceDepartmentScope, {
    method: 'POST',
    query: {},
    body: { department: 'Finance' },
    user: { role: 'Department Officer', department: 'Facilities & Energy' }
  });

  assert.equal(result.nextCalled, false);
  assert.equal(result.response.statusCode, 403);
});

test('admins can access every department', () => {
  assert.equal(
    canAccessDepartment(
      { role: 'Organization Admin', department: 'Sustainability Leadership' },
      'Finance'
    ),
    true
  );
});
