import test from 'node:test';
import assert from 'node:assert/strict';
import { validateWorkspacePath } from '../tools';

test('Suite D [Path Jail]: Traversal attempts with ../ are rejected', () => {
  const root = '/workspace/app';

  assert.throws(
    () => validateWorkspacePath(root, '../../etc/shadow'),
    /SECURITY POLICY VIOLATION/
  );

  assert.throws(
    () => validateWorkspacePath(root, 'sub/../../etc/passwd'),
    /SECURITY POLICY VIOLATION/
  );
});

test('Suite D [Path Jail]: Absolute path escape outside root is rejected', () => {
  const root = '/workspace/app';

  assert.throws(
    () => validateWorkspacePath(root, '/etc/hostname'),
    /SECURITY POLICY VIOLATION/
  );

  assert.throws(
    () => validateWorkspacePath(root, '/root/.ssh/id_rsa'),
    /SECURITY POLICY VIOLATION/
  );
});

test('Suite D [Path Jail]: Legitimate workspace paths resolve safely', () => {
  const root = '/workspace/app';

  const validRel = validateWorkspacePath(root, 'src/index.ts');
  assert.equal(validRel, '/workspace/app/src/index.ts');

  const validAbs = validateWorkspacePath(root, '/workspace/app/src/components/Header.tsx');
  assert.equal(validAbs, '/workspace/app/src/components/Header.tsx');
});
