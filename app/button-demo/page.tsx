"use client";

import { Button } from "@/components/ui/button";

export default function ButtonDemo() {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold text-primary mb-8">
        Button Demo - Primary Color Setup
      </h1>

      {/* Shadcn/UI Button Variants */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Shadcn/UI Button Variants</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="default">Default (Primary)</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      </div>

      {/* DaisyUI Button Variants */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">DaisyUI Button Variants</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="default">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Accent</Button>
          <Button variant="ghost">Neutral</Button>
          <Button variant="default">Info</Button>
          <Button variant="default">Success</Button>
          <Button variant="default">Warning</Button>
          <Button variant="destructive">Error</Button>
        </div>
      </div>

      {/* Button Sizes */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Button Sizes</h2>
        <div className="flex flex-wrap items-center gap-4">
          <Button size="sm">Extra Small</Button>
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
        </div>
      </div>

      {/* Custom Primary Color Test */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Custom Primary Color Test</h2>
        <div className="flex flex-wrap gap-4">
          <button className="btn btn-primary">DaisyUI Primary</button>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90">
            Tailwind Primary
          </button>
          <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
            Direct Blue
          </button>
        </div>
      </div>

      {/* Color Palette */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Color Palette</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-primary text-primary-foreground p-4 rounded-lg text-center">
            <div className="font-semibold">Primary</div>
            <div className="text-sm opacity-80">#0ea5e9</div>
          </div>
          <div className="bg-secondary text-secondary-foreground p-4 rounded-lg text-center">
            <div className="font-semibold">Secondary</div>
            <div className="text-sm opacity-80">#6b7280</div>
          </div>
          <div className="bg-accent text-accent-foreground p-4 rounded-lg text-center">
            <div className="font-semibold">Accent</div>
            <div className="text-sm opacity-80">#22c55e</div>
          </div>
          <div className="bg-base-100 text-base-content border border-base-300 p-4 rounded-lg text-center">
            <div className="font-semibold">Base</div>
            <div className="text-sm opacity-80">#ffffff</div>
          </div>
        </div>
      </div>
    </div>
  );
}
