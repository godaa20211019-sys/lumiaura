'use client';

import StudioHeader from '@/components/StudioHeader';
import StudioStage from '@/components/StudioStage';
import MaterialPanel from '@/components/MaterialPanel';
import StudioBottomBar from '@/components/StudioBottomBar';
import { WristSheet } from '@/components/WristSheet';
import { MeaningSheet, DetailSheet } from '@/components/MeaningSheet';
import ShareSheet from '@/components/ShareSheet';

export default function Home() {
  return (
    <main className="flex min-h-[100dvh] w-full justify-center bg-[#EFECE8]">
      <div className="relative flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-white shadow-2xl">
        <StudioHeader />
        <StudioStage />
        <MaterialPanel />
        <StudioBottomBar />

        <WristSheet />
        <MeaningSheet />
        <DetailSheet />
        <ShareSheet />
      </div>
    </main>
  );
}
