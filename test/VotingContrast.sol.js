

/* eslint-env mocha */
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VotingContract – Holesky-fork tests", function () {
  // reusable variables
  let Voting, voting;
  let owner;               // organiser / contract deployer
  let voter1, voter2;      // regular voters
  let candidate1, candidate2;

  // deploy once for the entire file – fixtures keep tests fast
  before(async function () {
    [owner, voter1, voter2, candidate1, candidate2] = await ethers.getSigners();

    Voting = await ethers.getContractFactory("Create");
    voting = await Voting.deploy();
    await voting.deployed();
  });

  // ------------------------------------------------------------
  // 1. Candidate workflow
  // ------------------------------------------------------------
  it("lets the organiser add a candidate", async function () {
    await expect(
      voting
        .connect(owner)
        .setCandidate(
          candidate1.address,
          "30",
          "Alice",
          "ipfs://image-alice",
          "ipfs://meta-alice"
        )
    )
      .to.emit(voting, "CandidateCreate") // yes, event is miss-spelled in the contract
      .withArgs(
        1, // first candidate id
        "30",
        "Alice",
        "ipfs://image-alice",
        0,                // voteCount
        candidate1.address,
        "ipfs://meta-alice"
      );

    // quick sanity check on getter
    const [age, name] = await voting.getCandidateData(candidate1.address);
    expect(age).to.equal("30");
    expect(name).to.equal("Alice");
  });

  it("reverts when a non-organiser tries to add a candidate", async function () {
    await expect(
      voting
        .connect(voter1)
        .setCandidate(
          candidate2.address,
          "42",
          "Bob",
          "ipfs://image-bob",
          "ipfs://meta-bob"
        )
    ).to.be.revertedWith("You have no azuthorization to set Candidate");
  });

  // ------------------------------------------------------------
  // 2. Voter workflow
  // ------------------------------------------------------------
  it("grants voting rights exactly once", async function () {
    // first time succeeds
    await voting
      .connect(owner)
      .voterRight(
        voter1.address,
        "Voter 1",
        "ipfs://avatar-v1",
        "ipfs://meta-v1"
      );

    // second time must revert
    await expect(
      voting
        .connect(owner)
        .voterRight(
          voter1.address,
          "Voter 1",
          "ipfs://avatar-v1",
          "ipfs://meta-v1"
        )
    ).to.be.reverted; // generic revert – contract emits no custom error text
  });

  // ------------------------------------------------------------
  // 3. Voting accuracy and double-vote guard
  // ------------------------------------------------------------
  it("allows a whitelisted voter to vote once only", async function () {
    // whitelist voter2 as well
    await voting
      .connect(owner)
      .voterRight(
        voter2.address,
        "Voter 2",
        "ipfs://avatar-v2",
        "ipfs://meta-v2"
      );

    // voter1 votes for candidate1 (id 1)
    await voting.connect(voter1).vote(candidate1.address, 1);

    // second attempt should revert
    await expect(
      voting.connect(voter1).vote(candidate1.address, 1)
    ).to.be.revertedWith("You have already voted");

    // voter2 votes for candidate1 as well
    await voting.connect(voter2).vote(candidate1.address, 1);

    // voteCount should now be 2
    const [, , , , voteCount] = await voting.getCandidateData(
      candidate1.address
    );
    expect(voteCount).to.equal(2);
  });

  // ------------------------------------------------------------
  // 4. Result consistency – highest-vote check
  // ------------------------------------------------------------
  it("returns the correct winner after multiple votes", async function () {
    // add a second candidate legitimately
    await voting
      .connect(owner)
      .setCandidate(
        candidate2.address,
        "42",
        "Bob",
        "ipfs://image-bob",
        "ipfs://meta-bob"
      );

    // cast one vote for candidate2 so both are tied 2-2
    await voting.connect(owner).voterRight(
      owner.address,
      "OrganiserVoter",
      "ipfs://avatar-org",
      "ipfs://meta-org"
    );
    await voting.connect(owner).vote(candidate2.address, 2);

    // compute highest vote manually
    const [, , , , votes1] = await voting.getCandidateData(candidate1.address);
    const [, , , , votes2] = await voting.getCandidateData(candidate2.address);

    // simple consistency assertion
    expect(votes1).to.equal(2);
    expect(votes2).to.equal(1); // 2-1 outcome

    // candidate1 should still be the winner
    expect(votes1).to.be.greaterThan(votes2);
  });
});
