"use client"; // Required for components with client-side interactions like useState

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Checkbox from '@/components/ui/Checkbox';
import Radio from '@/components/ui/Radio';
import Modal from '@/components/ui/Modal';

const UiKitPage: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [selectValue, setSelectValue] = useState('option2');
  const [textareaValue, setTextareaValue] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [radioValue, setRadioValue] = useState('radio1');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3 (Disabled)', disabled: true },
    { value: 'option4', label: 'Option 4' },
  ];

  const handleModalOpen = () => setIsModalOpen(true);
  const handleModalClose = () => setIsModalOpen(false);

  return (
    <div className="space-y-12 p-4 md:p-6">
      <h1 className="text-3xl font-bold text-neutralDarker">UI Kit Showcase</h1>

      {/* Buttons */}
      <section>
        <h2 className="text-2xl font-semibold text-neutralDark mb-4">Buttons</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-neutralDark mb-2">Primary</h3>
            <div className="flex flex-wrap gap-4 items-start">
              <Button variant="primary" size="small">Small Primary</Button>
              <Button variant="primary" size="medium">Medium Primary</Button>
              <Button variant="primary" size="large">Large Primary</Button>
              <Button variant="primary" disabled>Disabled Primary</Button>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-neutralDark mb-2">Secondary</h3>
            <div className="flex flex-wrap gap-4 items-start">
              <Button variant="secondary" size="small">Small Secondary</Button>
              <Button variant="secondary" size="medium">Medium Secondary</Button>
              <Button variant="secondary" size="large">Large Secondary</Button>
              <Button variant="secondary" disabled>Disabled Secondary</Button>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-neutralDark mb-2">Destructive</h3>
            <div className="flex flex-wrap gap-4 items-start">
              <Button variant="destructive" size="small">Small Destructive</Button>
              <Button variant="destructive" size="medium">Medium Destructive</Button>
              <Button variant="destructive" size="large">Large Destructive</Button>
              <Button variant="destructive" disabled>Disabled Destructive</Button>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-neutralDark mb-2">Icon Buttons</h3>
            <div className="flex flex-wrap gap-4 items-start">
              <Button variant="ghost" size="small" aria-label="Search">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
              </Button>
              <Button variant="ghost" size="medium" aria-label="Settings">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.108 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.11v1.093c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.78.93l-.15.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.149-.894c-.07-.424-.384-.764-.78-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.11v-1.094c0-.55.398-1.019.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.93l.15-.893z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </Button>
               <Button variant="ghost" size="large" aria-label="User" disabled>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Input Fields */}
      <section>
        <h2 className="text-2xl font-semibold text-neutralDark mb-4">Input Fields</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            placeholder="Normal Input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <Input placeholder="Disabled Input" disabled />
          <Input placeholder="Input with Error" hasError />
          <Input type="email" placeholder="Email Input" />
          <Input type="password" placeholder="Password Input" />
          <Input type="number" placeholder="Number Input" />
        </div>
      </section>

      {/* Select Fields */}
      <section>
        <h2 className="text-2xl font-semibold text-neutralDark mb-4">Select Fields</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select
            options={selectOptions}
            value={selectValue}
            onChange={(e) => setSelectValue(e.target.value)}
          />
          <Select options={selectOptions} disabled />
          <Select options={selectOptions} hasError />
        </div>
      </section>

      {/* Textarea Fields */}
      <section>
        <h2 className="text-2xl font-semibold text-neutralDark mb-4">Textarea Fields</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Textarea
            placeholder="Normal Textarea"
            value={textareaValue}
            onChange={(e) => setTextareaValue(e.target.value)}
          />
          <Textarea placeholder="Disabled Textarea" disabled />
          <Textarea placeholder="Textarea with Error" hasError />
        </div>
      </section>

      {/* Checkboxes */}
      <section>
        <h2 className="text-2xl font-semibold text-neutralDark mb-4">Checkboxes</h2>
        <div className="flex flex-col space-y-2">
          <Checkbox
            label="Default Checkbox"
            checked={isChecked}
            onChange={(e) => setIsChecked(e.target.checked)}
          />
          <Checkbox label="Checked by Default" defaultChecked />
          <Checkbox label="Disabled Unchecked Checkbox" disabled />
          <Checkbox label="Disabled Checked Checkbox" checked disabled />
        </div>
      </section>

      {/* Radio Buttons */}
      <section>
        <h2 className="text-2xl font-semibold text-neutralDark mb-4">Radio Buttons</h2>
        <div className="flex flex-col space-y-2">
          <Radio
            label="Radio Option 1"
            name="sampleRadio"
            value="radio1"
            checked={radioValue === 'radio1'}
            onChange={(e) => setRadioValue(e.target.value)}
          />
          <Radio
            label="Radio Option 2"
            name="sampleRadio"
            value="radio2"
            checked={radioValue === 'radio2'}
            onChange={(e) => setRadioValue(e.target.value)}
          />
          <Radio label="Disabled Radio Option" name="sampleRadio" value="radio3" disabled />
          <Radio label="Disabled Checked Radio" name="sampleRadio" value="radio4" checked disabled />
        </div>
      </section>

      {/* Modal */}
      <section>
        <h2 className="text-2xl font-semibold text-neutralDark mb-4">Modal</h2>
        <Button variant="primary" onClick={handleModalOpen}>Open Modal</Button>
        <Modal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          title="Sample Modal Title"
          size="medium"
          footer={
            <>
              <Button variant="secondary" onClick={handleModalClose}>Cancel</Button>
              <Button variant="primary" onClick={() => { alert('Primary action!'); handleModalClose(); }}>Confirm Action</Button>
            </>
          }
        >
          <p className="text-sm text-neutralTextSecondary">
            This is the content of the modal. You can put any React components here.
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
          <div className="mt-4">
            <Input placeholder="Example input inside modal" />
          </div>
        </Modal>
      </section>

      <div className="h-20"></div> {/* Extra space at the bottom */}
    </div>
  );
};

export default UiKitPage;
