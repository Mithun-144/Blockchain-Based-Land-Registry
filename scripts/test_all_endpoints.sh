#!/bin/bash
# =============================================================================
# NBF-Lite Property Smart Contract — Full API Test Suite
# Version: 2.5 | Channel: channel1 | Sequence: 9
# VM: 192.168.231.128:4000
# Run this ON the VM: bash test_all_endpoints.sh
# =============================================================================

BASE_URL="http://192.168.231.128:4000/fabric/v1"
CFGPATH="/home/admin1/.servers/ubfagent/vars/profiles/channel1_connection_for_nodesdk.json"
CCNAME="property"
CHANNEL="channel1"
# Wallet location: ~/.servers/nbf-samplerest/wallet/<mspId>/
# Users confirmed enrolled: manager@bank.com, court@judiciary.com,
#   officer@municipal.com, officer@panchayat.com, tahsildar@revenue.com
# Needs registering: registrar@sro.com, buyer@citizen.com

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

pass=0
fail=0
TEST_PROP="${TEST_PROP:-PROP$(date +%H%M%S)}"

invoke() {
  local label="$1"
  local payload="$2"
  echo -e "\n${CYAN}>>> $label${NC}"
  response=$(curl -s -X POST "$BASE_URL/invokecc" \
    -H "Content-Type: application/json" \
    -d "$payload")
  echo -e "${YELLOW}Response:${NC} $(echo $response | head -c 300)"
  if echo "$response" | grep -q '"sFlag":true'; then
    echo -e "${GREEN}PASSED${NC}"
    ((pass++))
  else
    echo -e "${RED}FAILED${NC}"
    ((fail++))
  fi
}

query() {
  local label="$1"
  local payload="$2"
  echo -e "\n${CYAN}>>> $label${NC}"
  response=$(curl -s -X POST "$BASE_URL/querycc" \
    -H "Content-Type: application/json" \
    -d "$payload")
  echo -e "${YELLOW}Response:${NC} $(echo $response | head -c 300)"
  if echo "$response" | grep -q '"sFlag":true'; then
    echo -e "${GREEN}PASSED${NC}"
    ((pass++))
  else
    echo -e "${RED}FAILED${NC}"
    ((fail++))
  fi
}

register_user() {
  local user="$1"
  local caname="$2"
  local mspId="$3"
  echo -e "\n${CYAN}>>> Registering: $user ($mspId)${NC}"
  response=$(curl -s -X POST "$BASE_URL/registeruser" \
    -H "Content-Type: application/json" \
    -d "{\"user\":\"$user\",\"caname\":\"$caname\",\"cfgpath\":\"$CFGPATH\",\"mspId\":\"$mspId\"}")
  echo "$response" | head -c 200
  echo ""
}

# =============================================================================
echo -e "\n${YELLOW}========== STEP 0: ENROLL ADMINS ==========${NC}"
for org in sro bank judiciary revenue municipal panchayat; do
  echo -e "\n${CYAN}>>> Enrolling admin for ca1.$org.com${NC}"
  curl -s -X POST "$BASE_URL/enrolladmin" \
    -H "Content-Type: application/json" \
    -d "{\"caname\":\"ca1.$org.com\",\"cfgpath\":\"$CFGPATH\",\"mspId\":\"$org-com\"}" | head -c 200
  echo ""
done

# =============================================================================
echo -e "\n${YELLOW}========== STEP 1: REGISTER USERS ==========${NC}"
register_user "registrar@sro.com"      "ca1.sro.com"        "sro-com"
register_user "manager@bank.com"       "ca1.bank.com"       "bank-com"
register_user "court@judiciary.com"    "ca1.judiciary.com"  "judiciary-com"
register_user "tahsildar@revenue.com"  "ca1.revenue.com"    "revenue-com"
register_user "officer@municipal.com"  "ca1.municipal.com"  "municipal-com"
register_user "officer@panchayat.com"  "ca1.panchayat.com"  "panchayat-com"
register_user "buyer@citizen.com"      "ca1.sro.com"        "sro-com"

# =============================================================================
echo -e "\n${YELLOW}========== STEP 2: INIT LEDGER ==========${NC}"
invoke "initLedger" \
  '{"fcn":"initLedger","args":[],"user":"registrar@sro.com","ccname":"property","channel":"channel1","cfgpath":"'"$CFGPATH"'","local":true,"mspId":"sro-com"}'

# =============================================================================
echo -e "\n${YELLOW}========== STEP 3: ADD PROPERTY ==========${NC}"
invoke "addProperty $TEST_PROP" \
  '{"fcn":"addProperty","args":["'"$TEST_PROP"'","Test Villa","12 MG Road Bangalore","1200 sq.ft","Residential","7500000","registrar@sro.com","municipal","SRV/2024/'"$TEST_PROP"'","EKHA-'"$TEST_PROP"'"],"user":"registrar@sro.com","ccname":"property","channel":"channel1","cfgpath":"'"$CFGPATH"'","local":true,"mspId":"sro-com"}'

# =============================================================================
echo -e "\n${YELLOW}========== STEP 4: RETRIEVE PROPERTY ==========${NC}"
query "retrieveProperty PROP001" \
  '{"fcn":"retrieveProperty","args":["PROP001"],"user":"registrar@sro.com","ccname":"property","channel":"channel1","cfgpath":"'"$CFGPATH"'","local":true,"mspId":"sro-com"}'

query "retrieveProperty $TEST_PROP" \
  '{"fcn":"retrieveProperty","args":["'"$TEST_PROP"'"],"user":"registrar@sro.com","ccname":"property","channel":"channel1","cfgpath":"'"$CFGPATH"'","local":true,"mspId":"sro-com"}'

# =============================================================================
echo -e "\n${YELLOW}========== STEP 5: AUTHORITY VERIFICATION ==========${NC}"
invoke "verifyAuthorityDetails $TEST_PROP (Municipal)" \
  '{"fcn":"verifyAuthorityDetails","args":["'"$TEST_PROP"'","EKHA-'"$TEST_PROP"'","SRV/2024/'"$TEST_PROP"'","8000000"],"user":"officer@municipal.com","ccname":"property","channel":"channel1","cfgpath":"'"$CFGPATH"'","local":true,"mspId":"municipal-com"}'

# =============================================================================
echo -e "\n${YELLOW}========== STEP 6: ENCUMBRANCE — BANK MORTGAGE ==========${NC}"
invoke "setEncumbranceStatus FLAG PROP001 (Bank Mortgage)" \
  '{"fcn":"setEncumbranceStatus","args":["PROP001","true","SBI Home Loan A/C 9918237411","BANK_MORTGAGE"],"user":"manager@bank.com","ccname":"property","channel":"channel1","cfgpath":"'"$CFGPATH"'","local":true,"mspId":"bank-com"}'

invoke "setEncumbranceStatus CLEAR PROP001 (Mortgage Discharged)" \
  '{"fcn":"setEncumbranceStatus","args":["PROP001","false","Loan closed - NOC issued","NONE"],"user":"manager@bank.com","ccname":"property","channel":"channel1","cfgpath":"'"$CFGPATH"'","local":true,"mspId":"bank-com"}'

# =============================================================================
echo -e "\n${YELLOW}========== STEP 7: JUDICIAL FREEZE / UNFREEZE ==========${NC}"
invoke "freezeProperty PROP002 (Court Injunction)" \
  '{"fcn":"freezeProperty","args":["PROP002","OS-4482/2024","Civil Court Restraint Order"],"user":"court@judiciary.com","ccname":"property","channel":"channel1","cfgpath":"'"$CFGPATH"'","local":true,"mspId":"judiciary-com"}'

invoke "unfreezeProperty PROP002 (Order Vacated)" \
  '{"fcn":"unfreezeProperty","args":["PROP002","OS-4482/2024-ORD","Court order vacated by HC"],"user":"court@judiciary.com","ccname":"property","channel":"channel1","cfgpath":"'"$CFGPATH"'","local":true,"mspId":"judiciary-com"}'

# =============================================================================
echo -e "\n${YELLOW}========== STEP 8: ENCUMBRANCE CERTIFICATE (Approach B) ==========${NC}"
query "generateEncumbranceCertificate PROP001 (Form 16 expected)" \
  '{"fcn":"generateEncumbranceCertificate","args":["PROP001"],"user":"registrar@sro.com","ccname":"property","channel":"channel1","cfgpath":"'"$CFGPATH"'","local":true,"mspId":"sro-com"}'

query "generateEncumbranceCertificate $TEST_PROP" \
  '{"fcn":"generateEncumbranceCertificate","args":["'"$TEST_PROP"'"],"user":"registrar@sro.com","ccname":"property","channel":"channel1","cfgpath":"'"$CFGPATH"'","local":true,"mspId":"sro-com"}'

# =============================================================================
echo -e "\n${YELLOW}========== STEP 9: VERIFY ROOT TITLE ==========${NC}"
query "verifyRootTitle PROP001" \
  '{"fcn":"verifyRootTitle","args":["PROP001"],"user":"registrar@sro.com","ccname":"property","channel":"channel1","cfgpath":"'"$CFGPATH"'","local":true,"mspId":"sro-com"}'

# =============================================================================
echo -e "\n${YELLOW}========== STEP 10: MARKETPLACE — LIST & BUY ==========${NC}"
invoke "listPropertyForSale $TEST_PROP (owned by registrar@sro.com)" \
  '{"fcn":"listPropertyForSale","args":["'"$TEST_PROP"'","9500000","registrar@sro.com"],"user":"registrar@sro.com","ccname":"property","channel":"channel1","cfgpath":"'"$CFGPATH"'","local":true,"mspId":"sro-com"}'

invoke "buyProperty $TEST_PROP" \
  '{"fcn":"buyProperty","args":["'"$TEST_PROP"'","buyer@citizen.com","CHALLAN-SBI-20241029-001"],"user":"buyer@citizen.com","ccname":"property","channel":"channel1","cfgpath":"'"$CFGPATH"'","local":true,"mspId":"sro-com"}'

# =============================================================================
echo -e "\n${YELLOW}========== STEP 11: QUERIES ==========${NC}"
query "queryAllRecords" \
  '{"fcn":"queryAllRecords","args":[],"user":"registrar@sro.com","ccname":"property","channel":"channel1","cfgpath":"'"$CFGPATH"'","local":true,"mspId":"sro-com"}'

query "queryListings (Marketplace)" \
  '{"fcn":"queryListings","args":[],"user":"registrar@sro.com","ccname":"property","channel":"channel1","cfgpath":"'"$CFGPATH"'","local":true,"mspId":"sro-com"}'

query "queryEncumberedProperties" \
  '{"fcn":"queryEncumberedProperties","args":[],"user":"manager@bank.com","ccname":"property","channel":"channel1","cfgpath":"'"$CFGPATH"'","local":true,"mspId":"bank-com"}'

query "queryFrozenProperties" \
  '{"fcn":"queryFrozenProperties","args":[],"user":"court@judiciary.com","ccname":"property","channel":"channel1","cfgpath":"'"$CFGPATH"'","local":true,"mspId":"judiciary-com"}'

query "queryByJurisdiction municipal" \
  '{"fcn":"queryByJurisdiction","args":["municipal"],"user":"officer@municipal.com","ccname":"property","channel":"channel1","cfgpath":"'"$CFGPATH"'","local":true,"mspId":"municipal-com"}'

query "queryPendingVerification" \
  '{"fcn":"queryPendingVerification","args":[],"user":"registrar@sro.com","ccname":"property","channel":"channel1","cfgpath":"'"$CFGPATH"'","local":true,"mspId":"sro-com"}'

# =============================================================================
echo -e "\n${YELLOW}========== STEP 12: PROPERTY HISTORY ==========${NC}"
query "getPropertyHistory PROP001" \
  '{"fcn":"getPropertyHistory","args":["PROP001"],"user":"registrar@sro.com","ccname":"property","channel":"channel1","cfgpath":"'"$CFGPATH"'","local":true,"mspId":"sro-com"}'

# =============================================================================
echo -e "\n${YELLOW}========== STEP 13: VALUATION UPDATE ==========${NC}"
invoke "updateValuation PROP001" \
  '{"fcn":"updateValuation","args":["PROP001","10000000","Annual Guideline Value Revision 2024-25"],"user":"registrar@sro.com","ccname":"property","channel":"channel1","cfgpath":"'"$CFGPATH"'","local":true,"mspId":"sro-com"}'

# =============================================================================
total=$((pass + fail))
echo -e "\n${YELLOW}============================================${NC}"
echo -e "${YELLOW}     NBF-Lite Test Suite Results${NC}"
echo -e "${YELLOW}============================================${NC}"
echo -e "  Total   : $total"
echo -e "  ${GREEN}Passed  : $pass${NC}"
echo -e "  ${RED}Failed  : $fail${NC}"
echo -e "${YELLOW}============================================${NC}"
