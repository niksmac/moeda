const assert = require('chai').assert;
const Web3 = require('web3');
const web3 = new Web3();

let idCounter = 0;

function isBigNumber(obj) {
  return obj.constructor.name === 'BigNumber';
}

// add bignumber support to chai assert
const PatchedAssert = {
  isAbove(valueToCheck, valueToBeAbove, message) {
    if (isBigNumber(valueToCheck) || isBigNumber(valueToBeAbove)) {
      const bnValue = web3.toBigNumber(valueToCheck);
      return assert.isTrue(
        bnValue.gt(valueToBeAbove),
        `${bnValue.toString('10')} should have been above ${valueToBeAbove.toString('10')}`);
    }

    return assert.isAbove(valueToCheck, valueToBeAbove, message);
  },
  isBelow(valueToCheck, valueToBeBelow, message) {
    if (isBigNumber(valueToCheck) || isBigNumber(valueToBeBelow)) {
      const bnValue = web3.toBigNumber(valueToCheck);
      return assert.isTrue(
        bnValue.lt(valueToBeBelow),
        `${bnValue.toString('10')} should have been below ${valueToBeBelow.toString('10')}`);
    }

    return assert.isBelow(valueToCheck, valueToBeBelow, message);
  },
  isAtLeast(valueToCheck, valueToBeAtLeast, message) {
    if (isBigNumber(valueToCheck) || isBigNumber(valueToBeAtLeast)) {
      const bnValue = web3.toBigNumber(valueToCheck);
      return assert.isTrue(
        bnValue.gte(valueToBeAtLeast),
        `${bnValue.toString('10')} should have been at least ${valueToBeAtLeast.toString('10')}`);
    }

    return assert.isAtLeast(valueToCheck, valueToBeAtLeast, message);
  },
  equals(valueToCheck, valueToEqual, message) {
    if (isBigNumber(valueToCheck) || isBigNumber(valueToEqual)) {
      const bnValue = web3.toBigNumber(valueToCheck);
      return assert.isTrue(bnValue.eq(valueToEqual),
        `${bnValue.toString('10')} should have been equal to ${valueToEqual.toString('10')}`);
    }

    return assert.equal(valueToCheck, valueToEqual, message);
  },
}

async function getAllEvents(instance, eventName) {
  const watcher = instance[eventName]();
  const events = await new Promise(
    (resolve, reject) => watcher.get(
      (error, result) => {
        watcher.stopWatching();
        if (error) {
          return reject(error);
        }
        return resolve(result);
      }));

  return events.map(event => event.args);
}

async function getLatestEvent(instance, eventName) {
  const events = await getAllEvents(instance, eventName);
  return events[events.length - 1];
}

module.exports = {
  assert: Object.assign({}, assert, PatchedAssert),
  fail(message) {
    throw new Error(message);
  },
  assertVmException(error) {
    assert.include(error.message, 'invalid opcode');
  },
  async shouldThrowVmException(fn) {
    try {
      await fn();
      assert.fail('should have thrown');
    } catch (error) {
      assert.include(error.message, 'invalid opcode');
    }
  },
  async mineUntilBlock(web3, blockNumber) {
    const currentBlock = web3.eth.blockNumber;
    const blocksToGo = blockNumber - currentBlock;

    if (blocksToGo < 1) {
      return;
    }

    for (let i = 0; i < blocksToGo; i++) {
      await mineBlock(web3);
    }
  },
  getLatestEvent,
  getAllEvents,
  mineBlock,
};

async function mineBlock(web3) {
  return new Promise((resolve, reject) => {
    const payload = {
      jsonrpc: "2.0",
      method: "evm_mine",
      id: ++idCounter,
    };
    web3.currentProvider.sendAsync(
      payload,
      (error, result) => error ? reject(error) : resolve(result));
    });
}
