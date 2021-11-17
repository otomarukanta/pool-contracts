const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

describe("CDS", function () {
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  const long = [
    "0x4e69636b00000000000000000000000000000000000000000000000000000000",
    "0x4e69636b00000000000000000000000000000000000000000000000000000001",
    "0x4e69636b00000000000000000000000000000000000000000000000000000002",
    "0x4e69636b00000000000000000000000000000000000000000000000000000003",
    "0x4e69636b00000000000000000000000000000000000000000000000000000004",
    "0x4e69636b00000000000000000000000000000000000000000000000000000005",
    "0x4e69636b00000000000000000000000000000000000000000000000000000006",
    "0x4e69636b00000000000000000000000000000000000000000000000000000007",
    "0x4e69636b00000000000000000000000000000000000000000000000000000008",
    "0x4e69636b00000000000000000000000000000000000000000000000000000009",
    "0x4e69636b00000000000000000000000000000000000000000000000000000010",
    "0x4e69636b00000000000000000000000000000000000000000000000000000011",
    "0x4e69636b00000000000000000000000000000000000000000000000000000021",
    "0x4e69636b00000000000000000000000000000000000000000000000000000031",
    "0x4e69636b00000000000000000000000000000000000000000000000000000041",
    "0x4e69636b00000000000000000000000000000000000000000000000000000051",
    "0x4e69636b00000000000000000000000000000000000000000000000000000061",
    "0x4e69636b00000000000000000000000000000000000000000000000000000071",
    "0x4e69636b00000000000000000000000000000000000000000000000000000081",
    "0x4e69636b00000000000000000000000000000000000000000000000000000091",
    "0x4e69636b00000000000000000000000000000000000000000000000000000101",
    "0x4e69636b00000000000000000000000000000000000000000000000000000201",
    "0x4e69636b00000000000000000000000000000000000000000000000000000301",
    "0x4e69636b00000000000000000000000000000000000000000000000000000401",
    "0x4e69636b00000000000000000000000000000000000000000000000000000501",
    "0x4e69636b00000000000000000000000000000000000000000000000000000601",
    "0x4e69636b00000000000000000000000000000000000000000000000000000701",
    "0x4e69636b00000000000000000000000000000000000000000000000000000801",
    "0x4e69636b00000000000000000000000000000000000000000000000000000901",
    "0x4e69636b00000000000000000000000000000000000000000000000000001001",
    "0x4e69636b00000000000000000000000000000000000000000000000000001101",
    "0x4e69636b00000000000000000000000000000000000000000000000000001201",
    "0x4e69636b00000000000000000000000000000000000000000000000000001301",
    "0x4e69636b00000000000000000000000000000000000000000000000000001401",
    "0x4e69636b00000000000000000000000000000000000000000000000000001501",
    "0x4e69636b00000000000000000000000000000000000000000000000000001601",
    "0x4e69636b00000000000000000000000000000000000000000000000000001701",
    "0x4e69636b00000000000000000000000000000000000000000000000000001801",
    "0x4e69636b00000000000000000000000000000000000000000000000000001901",
    "0x4e69636b00000000000000000000000000000000000000000000000000002001",
  ];
  beforeEach(async () => {
    //import
    [creator, alice, bob, chad, tom] = await ethers.getSigners();
    const Ownership = await ethers.getContractFactory("Ownership");
    const DAI = await ethers.getContractFactory("TestERC20Mock");
    const PoolTemplate = await ethers.getContractFactory("PoolTemplate");
    const IndexTemplate = await ethers.getContractFactory("IndexTemplate");
    const CDSTemplate = await ethers.getContractFactory("CDSTemplate");
    const Factory = await ethers.getContractFactory("Factory");
    const Vault = await ethers.getContractFactory("Vault");
    const Registry = await ethers.getContractFactory("Registry");
    const FeeModel = await ethers.getContractFactory("FeeModel");
    const PremiumModel = await ethers.getContractFactory("PremiumModel");
    const Parameters = await ethers.getContractFactory("Parameters");
    const Contorller = await ethers.getContractFactory("Controller");
    const Minter = await ethers.getContractFactory("MinterMock");
    //deploy

    ownership = await Ownership.deploy();
    dai = await DAI.deploy();
    registry = await Registry.deploy(ownership.address);
    factory = await Factory.deploy(registry.address, ownership.address);
    fee = await FeeModel.deploy(ownership.address);
    premium = await PremiumModel.deploy();
    controller = await Contorller.deploy(dai.address, ownership.address);
    vault = await Vault.deploy(
      dai.address,
      registry.address,
      controller.address,
      ownership.address
    );

    poolTemplate = await PoolTemplate.deploy();
    cdsTemplate = await CDSTemplate.deploy();
    indexTemplate = await IndexTemplate.deploy();
    parameters = await Parameters.deploy(ownership.address);
    minter = await Minter.deploy();


    //set up
    await dai.mint(chad.address, (100000).toString());
    await dai.mint(bob.address, (100000).toString());
    await dai.mint(alice.address, (100000).toString());

    await registry.setFactory(factory.address);

    await factory.approveTemplate(poolTemplate.address, true, false, true);
    await factory.approveTemplate(indexTemplate.address, true, false, true);
    await factory.approveTemplate(cdsTemplate.address, true, false, true);

    await factory.approveReference(poolTemplate.address, 0, dai.address, true);
    await factory.approveReference(poolTemplate.address, 1, dai.address, true);
    await factory.approveReference(
      poolTemplate.address,
      2,
      registry.address,
      true
    );
    await factory.approveReference(
      poolTemplate.address,
      3,
      parameters.address,
      true
    );

    await factory.approveReference(
      indexTemplate.address,
      2,
      parameters.address,
      true
    );
    await factory.approveReference(indexTemplate.address, 0, dai.address, true);
    await factory.approveReference(
      indexTemplate.address,
      1,
      registry.address,
      true
    );

    await factory.approveReference(
      cdsTemplate.address,
      2,
      parameters.address,
      true
    );
    await factory.approveReference(cdsTemplate.address, 0, dai.address, true);
    await factory.approveReference(
      cdsTemplate.address,
      1,
      registry.address,
      true
    );

    await premium.setPremium("2000", "50000");
    await fee.setFee("10000");
    await parameters.setCDSPremium(ZERO_ADDRESS, "2000");
    await parameters.setDepositFee(ZERO_ADDRESS, "1000");
    await parameters.setGrace(ZERO_ADDRESS, "259200");
    await parameters.setLockup(ZERO_ADDRESS, "604800");
    await parameters.setMindate(ZERO_ADDRESS, "604800");
    await parameters.setPremiumModel(ZERO_ADDRESS, premium.address);
    await parameters.setFeeModel(ZERO_ADDRESS, fee.address);
    await parameters.setWithdrawable(ZERO_ADDRESS, "86400000");
    await parameters.setVault(dai.address, vault.address);
    await parameters.setMaxList(ZERO_ADDRESS, "10");
    await parameters.setMinter(minter.address);

    await factory.createMarket(
      poolTemplate.address,
      "Here is metadata.",
      [1, 0],
      [dai.address, dai.address, registry.address, parameters.address]
    );
    await factory.createMarket(
      poolTemplate.address,
      "Here is metadata.",
      [1, 0],
      [dai.address, dai.address, registry.address, parameters.address]
    );
    const marketAddress1 = await factory.markets(0);
    const marketAddress2 = await factory.markets(1);
    market1 = await PoolTemplate.attach(marketAddress1);
    market2 = await PoolTemplate.attach(marketAddress2);

    await factory.createMarket(
      cdsTemplate.address,
      "Here is metadata.",
      [0],
      [dai.address, registry.address, parameters.address]
    );
    await factory.createMarket(
      indexTemplate.address,
      "Here is metadata.",
      [0],
      [dai.address, registry.address, parameters.address]
    );
    const marketAddress3 = await factory.markets(2);
    const marketAddress4 = await factory.markets(3);
    cds = await CDSTemplate.attach(marketAddress3);
    index = await IndexTemplate.attach(marketAddress4);

    await registry.setCDS(ZERO_ADDRESS, cds.address);


    await index.set("0", market1.address, "1000");
    await index.setLeverage("20000");
  });

  describe("Condition", function () {
    it("Should contracts be deployed", async () => {
      expect(dai.address).to.exist;
      expect(factory.address).to.exist;
      expect(parameters.address).to.exist;
      expect(vault.address).to.exist;
      expect(market1.address).to.exist;
      expect(market2.address).to.exist;
      expect(index.address).to.exist;
      expect(cds.address).to.exist;
      expect(await index.totalAllocPoint()).to.equal("1000");
      expect(await index.targetLev()).to.equal("20000");
    });
  });
  describe("iToken", function () {
    beforeEach(async () => {
      await dai.connect(alice).approve(vault.address, 10000);
      await dai.connect(bob).approve(vault.address, 10000);
      await dai.connect(chad).approve(vault.address, 10000);

      await cds.connect(alice).deposit("10000");
      await cds.connect(bob).deposit("10000");
      await cds.connect(chad).deposit("10000");
    });

    describe("allowance", function () {
      it("returns no allowance", async function () {
        expect(await cds.allowance(alice.address, tom.address)).to.equal("0");
      });
      it("approve/ increases/ decrease change allowance", async function () {
        await cds.connect(alice).approve(tom.address, 5000);
        expect(await cds.allowance(alice.address, tom.address)).to.equal(
          "5000"
        );
        await cds.connect(alice).decreaseAllowance(tom.address, "5000");
        expect(await cds.allowance(alice.address, tom.address)).to.equal("0");
        await cds.connect(alice).increaseAllowance(tom.address, "10000");
        expect(await cds.allowance(alice.address, tom.address)).to.equal(
          "10000"
        );
      });
    });

    describe("total supply", function () {
      it("returns the total amount of tokens", async function () {
        expect(await cds.totalSupply()).to.equal("29700");
      });
    });

    describe("balanceOf", function () {
      context("when the requested account has no tokens", function () {
        it("returns zero", async function () {
          expect(await cds.balanceOf(tom.address)).to.equal("0");
        });
      });

      context("when the requested account has some tokens", function () {
        it("returns the total amount of tokens", async function () {
          expect(await cds.balanceOf(alice.address)).to.equal("9900");
        });
      });
    });

    describe("transfer", function () {
      context("when the recipient is not the zero address", function () {
        context("when the sender does not have enough balance", function () {
          it("reverts", async function () {
            await expect(
              cds.connect(alice).transfer(tom.address, "9901")
            ).to.reverted;
          });
        });

        context("when the sender has enough balance", function () {
          it("transfers the requested amount", async function () {
            await cds.connect(alice).transfer(tom.address, "9900");
            expect(await cds.balanceOf(alice.address)).to.equal("0");
            expect(await cds.balanceOf(tom.address)).to.equal("9900");
          });
        });
      });

      context("when the recipient is the zero address", function () {
        it("reverts", async function () {
          await expect(
            cds.connect(tom).transfer(ZERO_ADDRESS, 10000)
          ).to.revertedWith("ERC20: transfer to the zero address");
        });
      });
    });
  });
  describe("Liquidity providing life cycles", function () {
    it("allows deposit and withdraw", async function () {
      await dai.connect(alice).approve(vault.address, 10000);
      expect(await cds.totalSupply()).to.equal("0");
      expect(await cds.totalLiquidity()).to.equal("0");
      await cds.connect(alice).deposit("10000");
      await cds.connect(alice).requestWithdraw("9900");
      expect(await cds.totalSupply()).to.equal("9900");
      expect(await cds.totalLiquidity()).to.equal("9900");
      expect(await vault.valueAll()).to.equal("10000");
      expect(await vault.totalAttributions()).to.equal("10000");
      expect(await vault.underlyingValue(cds.address)).to.equal("9900");
      expect(await vault.attributions(cds.address)).to.equal("9900");
      let bnresult = await BigNumber.from("1000000000000000000");
      expect(await cds.rate()).to.equal(bnresult);
      await ethers.provider.send("evm_increaseTime", [86400 * 8]);
      await cds.connect(alice).withdraw("9900");
      expect(await cds.totalSupply()).to.equal("0");
      expect(await cds.totalLiquidity()).to.equal("0");
    });

    it("DISABLES withdraw more than balance", async function () {
      await dai.connect(alice).approve(vault.address, 10000);
      expect(await cds.totalSupply()).to.equal("0");
      expect(await cds.totalLiquidity()).to.equal("0");
      await cds.connect(alice).deposit("10000");
      await cds.connect(alice).requestWithdraw("9900");
      await ethers.provider.send("evm_increaseTime", [86400 * 8]);
      await expect(cds.connect(alice).withdraw("20000")).to.revertedWith(
        "ERROR: WITHDRAWAL_EXCEEDED_REQUEST"
      );
    });

    it("DISABLES withdraw zero balance", async function () {
      await dai.connect(alice).approve(vault.address, 10000);
      expect(await cds.totalSupply()).to.equal("0");
      expect(await cds.totalLiquidity()).to.equal("0");
      await cds.connect(alice).deposit("10000");
      await cds.connect(alice).requestWithdraw("9900");

      await ethers.provider.send("evm_increaseTime", [86400 * 8]);
      await expect(cds.connect(alice).withdraw("0")).to.revertedWith(
        "ERROR: WITHDRAWAL_ZERO"
      );
    });

    it("DISABLES withdraw until lockup period ends", async function () {
      await dai.connect(alice).approve(vault.address, 10000);
      expect(await cds.totalSupply()).to.equal("0");
      expect(await cds.totalLiquidity()).to.equal("0");
      await cds.connect(alice).deposit("10000");
      await cds.connect(alice).requestWithdraw("9900");
      await expect(cds.connect(alice).withdraw("9900")).to.revertedWith(
        "ERROR: WITHDRAWAL_QUEUE"
      );
    });

    it("accrues premium after deposit", async function () {
      await dai.connect(alice).approve(vault.address, 10000);
      await dai.connect(bob).approve(vault.address, 20000);
      expect(await cds.totalSupply()).to.equal("0");
      expect(await cds.totalLiquidity()).to.equal("0");
      await cds.connect(alice).deposit("10000");
      await cds.connect(alice).requestWithdraw("9900");
      let bnresult = await BigNumber.from("1000000000000000000");
      expect(await cds.rate()).to.equal(bnresult);
      await index.connect(bob).deposit("10000");
      bnresult = await BigNumber.from("1020202020202020202");
      expect(await cds.rate()).to.equal(bnresult);
      expect(await dai.balanceOf(bob.address)).to.closeTo("90000", "5"); //verify
      expect(await cds.totalLiquidity()).to.closeTo("10100", "5");
      expect(await vault.underlyingValue(creator.address)).to.closeTo(
        "200",
        "5"
      );
      //withdrawal also harvest accrued premium
      await ethers.provider.send("evm_increaseTime", [86400 * 10]);
      await cds.connect(alice).withdraw("9900");
      //Harvested premium is reflected on their account balance
      expect(await dai.balanceOf(alice.address)).to.closeTo("100100", "3"); //verify
    });

    it("DISABLE deposit when locked(withdrawal is possible)", async function () {
      await dai.connect(alice).approve(vault.address, 20000);
      await cds.connect(alice).deposit("10000");
      await cds.connect(alice).requestWithdraw("9900");
      expect(await cds.totalSupply()).to.equal("9900");
      expect(await cds.totalLiquidity()).to.equal("9900");
      await cds.setPaused(true);
      await expect(cds.connect(alice).deposit("10000")).to.revertedWith(
        "ERROR: DEPOSIT_DISABLED"
      );
    });

    it("devaluate underlying when cover claim is accepted", async function () {
      await dai.connect(alice).approve(vault.address, 20000);
      await cds.connect(alice).deposit("10000");
      await cds.connect(alice).requestWithdraw("9900");
      expect(await cds.totalSupply()).to.equal("9900");
      expect(await cds.totalLiquidity()).to.equal("9900");
      await index.connect(alice).deposit("1000");
      expect(await index.totalSupply()).to.equal("970");
      expect(await index.totalLiquidity()).to.equal("970");
      expect(await market1.totalLiquidity()).to.equal("19400");
      expect(await cds.totalLiquidity()).to.equal("9920");
      expect(await vault.underlyingValue(market1.address)).to.equal("0");
      expect(await vault.underlyingValue(index.address)).to.equal("970");
      expect(await vault.underlyingValue(cds.address)).to.equal("9920");
      await dai.connect(bob).approve(vault.address, 10000);
      let currentTimestamp = BigNumber.from(
        (await ethers.provider.getBlock("latest")).timestamp
      );
      //let endTime = await currentTimestamp.add(86400 * 8);
      await market1
        .connect(bob)
        .insure(
          "9000",
          "10000",
          86400 * 8,
          "0x4e69636b00000000000000000000000000000000000000000000000000000000"
        );
      expect(await dai.balanceOf(bob.address)).to.closeTo("99974", "2");
      let incident = BigNumber.from(
        (await ethers.provider.getBlock("latest")).timestamp
      );
      const tree = await new MerkleTree(long, keccak256, {
        hashLeaves: true,
        sortPairs: true,
      });
      const root = await tree.getHexRoot();
      const leaf = keccak256(long[0]);
      const proof = await tree.getHexProof(leaf);
      await market1.applyCover(
        "604800",
        5000,
        10000,
        incident,
        root,
        long,
        "metadata"
      );

      await market1.connect(bob).redeem("0", proof);
      await expect(market1.connect(alice).unlock("0")).to.revertedWith(
        "ERROR: UNLOCK_BAD_COINDITIONS"
      );

      expect(await dai.balanceOf(bob.address)).to.closeTo("104474", "2");
      expect(await index.totalSupply()).to.equal("970");
      expect(await market1.totalLiquidity()).to.closeTo("0", "1");
      expect(await index.totalLiquidity()).to.closeTo("0", "1");
      expect(await cds.totalLiquidity()).to.closeTo("6413", "1");
      expect(await vault.underlyingValue(index.address)).to.closeTo("0", "1");

      await ethers.provider.send("evm_increaseTime", [86400 * 11]);
      await market1.resume();
      await cds.connect(alice).withdraw("9900");
      expect(await dai.balanceOf(alice.address)).to.closeTo("95415", "5"); //verify
      expect(await dai.balanceOf(bob.address)).to.closeTo("104470", "5"); //verify
    });
    it("CDS compensate insolvent amount within Index", async function () {
      await dai.connect(alice).approve(vault.address, 20000);
      await cds.connect(alice).deposit("1000");
      await cds.connect(alice).requestWithdraw("990");
      expect(await cds.totalSupply()).to.equal("990");
      expect(await cds.totalLiquidity()).to.equal("990");
      await index.connect(alice).deposit("1000");
      expect(await index.totalSupply()).to.equal("970");
      expect(await index.totalLiquidity()).to.equal("970");
      expect(await market1.totalLiquidity()).to.equal("19400");
      expect(await cds.totalLiquidity()).to.equal("1010");
      expect(await vault.underlyingValue(market1.address)).to.equal("0");
      expect(await vault.underlyingValue(index.address)).to.equal("970");
      expect(await vault.underlyingValue(cds.address)).to.equal("1010");
      await dai.connect(bob).approve(vault.address, 10000);
      let currentTimestamp = BigNumber.from(
        (await ethers.provider.getBlock("latest")).timestamp
      );
      //let endTime = await currentTimestamp.add(86400 * 8);
      await market1
        .connect(bob)
        .insure(
          "9000",
          "10000",
          86400 * 8,
          "0x4e69636b00000000000000000000000000000000000000000000000000000000"
        );
      expect(await dai.balanceOf(bob.address)).to.closeTo("99974", "2");
      let incident = BigNumber.from(
        (await ethers.provider.getBlock("latest")).timestamp
      );
      const tree = await new MerkleTree(long, keccak256, {
        hashLeaves: true,
        sortPairs: true,
      });
      const root = await tree.getHexRoot();
      const leaf = keccak256(long[0]);
      const proof = await tree.getHexProof(leaf);
      await market1.applyCover(
        "604800",
        10000,
        10000,
        incident,
        root,
        long,
        "metadata"
      );

      await market1.connect(bob).redeem("0", proof);
      await expect(market1.connect(alice).unlock("0")).to.revertedWith(
        "ERROR: UNLOCK_BAD_COINDITIONS"
      );

      expect(await dai.balanceOf(bob.address)).to.closeTo("108974", "2");
      expect(await index.totalSupply()).to.equal("970");
      expect(await market1.totalLiquidity()).to.closeTo("0", "1");
      expect(await index.totalLiquidity()).to.closeTo("0", "1");
      expect(await cds.totalLiquidity()).to.closeTo("0", "1");
      expect(await vault.underlyingValue(index.address)).to.closeTo("0", "1");

      await ethers.provider.send("evm_increaseTime", [86400 * 11]);
      await market1.resume();
      expect(await dai.balanceOf(alice.address)).to.closeTo("98000", "5"); //verify
    });
  });
  describe.skip("Admin functions", function () {
    it("allows changing metadata", async function () {
      expect(await cds.metadata()).to.equal("Here is metadata.");
      await cds.changeMetadata("new metadata");
      expect(await cds.metadata()).to.equal("new metadata");
    });
  });
});