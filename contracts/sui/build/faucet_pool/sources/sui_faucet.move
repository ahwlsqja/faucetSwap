module faucet_pool::sui_faucet {
    use std::option;
    use sui::balance::{Self, Balance};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::clock::{Self, Clock};
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::table::{Self, Table};
    
    // 상수들
    const COOLDOWN_TIME: u64 = 86400000; // 24시간 (milliseconds)
    const MIN_DONATION: u64 = 1000000; // 0.001 SUI (MIST 단위)
    
    // 에러 코드들
    const ECooldownActive: u64 = 1;
    const EInsufficientBalance: u64 = 2;
    const EDonationTooSmall: u64 = 3;
    const ENotOwner: u64 = 4;
    
    // 메인 풀 구조체
    struct FaucetPool has key {
        id: UID,
        balance: Balance<SUI>,
        faucet_amount: u64, // 기본 0.1 SUI (MIST 단위)
        total_donations: u64,
        total_claimed: u64,
        last_claims: Table<address, u64>, // 사용자별 마지막 클레임 시간
        donations: Table<address, u64>, // 사용자별 기부 총액
        owner: address,
    }
    
    // 이벤트들
    struct DonationReceived has copy, drop {
        donor: address,
        amount: u64,
        message: vector<u8>,
        timestamp: u64,
    }
    
    struct FaucetClaimed has copy, drop {
        user: address,
        amount: u64,
        timestamp: u64,
    }
    
    struct FaucetAmountUpdated has copy, drop {
        old_amount: u64,
        new_amount: u64,
    }
    
    // 풀 초기화 (배포시 한번만 실행)
    fun init(ctx: &mut TxContext) {
        let pool = FaucetPool {
            id: object::new(ctx),
            balance: balance::zero<SUI>(),
            faucet_amount: 100000000, // 0.1 SUI
            total_donations: 0,
            total_claimed: 0,
            last_claims: table::new(ctx),
            donations: table::new(ctx),
            owner: tx_context::sender(ctx),
        };
        
        transfer::share_object(pool);
    }
    
    // 🎯 기부 함수
    public entry fun donate(
        pool: &mut FaucetPool,
        payment: Coin<SUI>,
        message: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let amount = coin::value(&payment);
        assert!(amount >= MIN_DONATION, EDonationTooSmall);
        
        let donor = tx_context::sender(ctx);
        let coin_balance = coin::into_balance(payment);
        
        // 풀에 추가
        balance::join(&mut pool.balance, coin_balance);
        pool.total_donations = pool.total_donations + amount;
        
        // 기부자별 기록 업데이트
        if (table::contains(&pool.donations, donor)) {
            let current = table::remove(&mut pool.donations, donor);
            table::add(&mut pool.donations, donor, current + amount);
        } else {
            table::add(&mut pool.donations, donor, amount);
        };
        
        // 이벤트 발생
        event::emit(DonationReceived {
            donor,
            amount,
            message,
            timestamp: clock::timestamp_ms(clock),
        });
    }
    
    // 🚀 Faucet 요청 (완전 자동화)
    public entry fun request_faucet(
        pool: &mut FaucetPool,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let user = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);
        
        // 쿨다운 체크
        if (table::contains(&pool.last_claims, user)) {
            let last_claim = *table::borrow(&pool.last_claims, user);
            assert!(current_time >= last_claim + COOLDOWN_TIME, ECooldownActive);
            table::remove(&mut pool.last_claims, user);
        };
        
        // 잔액 체크
        assert!(balance::value(&pool.balance) >= pool.faucet_amount, EInsufficientBalance);
        
        // 쿨다운 업데이트
        table::add(&mut pool.last_claims, user, current_time);
        pool.total_claimed = pool.total_claimed + pool.faucet_amount;
        
        // 토큰 전송
        let payout = coin::take(&mut pool.balance, pool.faucet_amount, ctx);
        transfer::public_transfer(payout, user);
        
        // 이벤트 발생
        event::emit(FaucetClaimed {
            user,
            amount: pool.faucet_amount,
            timestamp: current_time,
        });
    }
    
    // 📊 쿨다운 체크 함수
    public fun can_claim(
        pool: &FaucetPool, 
        user: address, 
        clock: &Clock
    ): bool {
        if (!table::contains(&pool.last_claims, user)) {
            return true
        };
        
        let last_claim = *table::borrow(&pool.last_claims, user);
        let current_time = clock::timestamp_ms(clock);
        current_time >= last_claim + COOLDOWN_TIME
    }
    
    public fun get_cooldown_remaining(
        pool: &FaucetPool,
        user: address,
        clock: &Clock
    ): u64 {
        if (!table::contains(&pool.last_claims, user)) {
            return 0
        };
        
        let last_claim = *table::borrow(&pool.last_claims, user);
        let current_time = clock::timestamp_ms(clock);
        let next_claim_time = last_claim + COOLDOWN_TIME;
        
        if (current_time >= next_claim_time) {
            0
        } else {
            next_claim_time - current_time
        }
    }
    
    // 🏆 기여도 레벨 계산
    public fun get_contribution_level(pool: &FaucetPool, user: address): u8 {
        if (!table::contains(&pool.donations, user)) {
            return 0
        };
        
        let donated = *table::borrow(&pool.donations, user);
        
        if (donated >= 10000000000) { 4 } // 10 SUI - Diamond
        else if (donated >= 5000000000) { 3 } // 5 SUI - Gold  
        else if (donated >= 1000000000) { 2 } // 1 SUI - Silver
        else if (donated >= 100000000) { 1 } // 0.1 SUI - Bronze
        else { 0 } // None
    }
    
    // 📈 풀 통계 조회
    public fun get_pool_stats(pool: &FaucetPool): (u64, u64, u64, u64) {
        (
            balance::value(&pool.balance), // 현재 잔액
            pool.total_donations,          // 총 기부액
            pool.total_claimed,           // 총 클레임액
            pool.faucet_amount           // 1회 지급액
        )
    }
    
    public fun get_user_donation(pool: &FaucetPool, user: address): u64 {
        if (table::contains(&pool.donations, user)) {
            *table::borrow(&pool.donations, user)
        } else {
            0
        }
    }
    
    // 🛠️ 관리자 기능들
    public entry fun set_faucet_amount(
        pool: &mut FaucetPool,
        new_amount: u64,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == pool.owner, ENotOwner);
        
        let old_amount = pool.faucet_amount;
        pool.faucet_amount = new_amount;
        
        event::emit(FaucetAmountUpdated {
            old_amount,
            new_amount,
        });
    }
    
    public entry fun emergency_withdraw(
        pool: &mut FaucetPool,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == pool.owner, ENotOwner);
        
        let total_balance = balance::value(&pool.balance);
        let withdrawn = coin::take(&mut pool.balance, total_balance, ctx);
        transfer::public_transfer(withdrawn, pool.owner);
    }
    
    public entry fun transfer_ownership(
        pool: &mut FaucetPool,
        new_owner: address,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == pool.owner, ENotOwner);
        pool.owner = new_owner;
    }
}