import { parseAbi } from "viem";
import deployments from "../../../packages/contracts/deployments/monad-testnet.json" with { type: "json" };

export const tokenFcDeployments = {
  clubContest: deployments.clubContest as `0x${string}`,
  clubPass: deployments.clubPass as `0x${string}`,
  tfcToken: deployments.tfcToken as `0x${string}`,
};

export const clubPassAbi = parseAbi([
  "function mint(address to, uint256 clubId) returns (uint256 tokenId)",
  "function membershipTokenOf(address holder) view returns (uint256)",
]);

export const clubContestAbi = parseAbi([
  "function supportDesign(uint256 contestId, uint256 designId, uint256 amount, bytes32 intentId)",
  "event SupportAdded(uint256 indexed contestId, uint256 indexed designId, address indexed supporter, uint256 amount, bytes32 intentId)",
]);

export const tfcTokenAbi = parseAbi([
  "function burn(address from, uint256 amount)",
  "function mint(address to, uint256 amount)",
]);

export const TFC_DECIMALS = 18n;
export const ONE_TFC_ONCHAIN = 10n ** TFC_DECIMALS;

export function toOnchainTfcUnits(amountRaw: bigint) {
  return amountRaw * ONE_TFC_ONCHAIN;
}
