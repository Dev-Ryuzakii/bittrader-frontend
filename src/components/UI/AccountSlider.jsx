import React, { useRef } from 'react';
import AccountCard from './AccountCard';

const AccountSlider = ({ totalBalance, totalPnl, totalEquity, accounts }) => {
  const scrollRef = useRef(null);

  return (
    <div className="relative">
      {/* Scrollable Cards Container */}
      <div
        ref={scrollRef}
        className="overflow-x-auto"
        style={{
          scrollbarWidth: 'none', /* Firefox */
          msOverflowStyle: 'none', /* IE and Edge */
        }}
      >
        <style>
          {`.overflow-x-auto::-webkit-scrollbar {
            display: none; /* Chrome, Safari and Opera */
          }`}
        </style>
        
        <div className="flex space-x-4 pb-2" style={{ minWidth: 'max-content' }}>
          {/* Total Portfolio Card */}
          <AccountCard
            balance={totalBalance}
            pnl={totalPnl}
            equity={totalEquity}
            colorVariant={1}
            isTotal={true}
          />
          
          {/* Individual Account Cards */}
          {accounts.map((account) => (
            <AccountCard
              key={account.account_id || account.id}
              accountName={account.accountName}
              balance={account.balance}
              pnl={account.pnl}
              equity={account.equity}
              colorVariant={account.colorVariant}
              isTotal={false}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AccountSlider;
