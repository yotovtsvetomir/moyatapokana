import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import Pagination from './Pagination';
import React, { useState } from 'react';

const meta: Meta<typeof Pagination> = {
  title: 'UI/Pagination',
  component: Pagination,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Pagination>;

const WithState = (args: { totalPages: number; initialPage?: number }) => {
  const [currentPage, setCurrentPage] = useState(args.initialPage || 1);

  return (
    <div style={{ padding: 20 }}>
      <Pagination
        currentPage={currentPage}
        totalPages={args.totalPages}
        onPageChange={setCurrentPage}
      />
      <p style={{ marginTop: 12 }}>Current Page: {currentPage}</p>
    </div>
  );
};

export const Default: Story = {
  render: () => <WithState totalPages={5} />,
};

export const TenPages: Story = {
  render: () => <WithState totalPages={20} />,
};

export const OnePage: Story = {
  render: () => <WithState totalPages={1} />,
};

export const StartFromMiddle: Story = {
  render: () => <WithState totalPages={7} initialPage={4} />,
};
