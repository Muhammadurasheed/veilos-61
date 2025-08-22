import React, { useState, useMemo } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Major cities for quick selection
const cities = [
  { value: 'new-york', label: 'New York', country: 'United States' },
  { value: 'london', label: 'London', country: 'United Kingdom' },
  { value: 'toronto', label: 'Toronto', country: 'Canada' },
  { value: 'sydney', label: 'Sydney', country: 'Australia' },
  { value: 'paris', label: 'Paris', country: 'France' },
  { value: 'berlin', label: 'Berlin', country: 'Germany' },
  { value: 'madrid', label: 'Madrid', country: 'Spain' },
  { value: 'rome', label: 'Rome', country: 'Italy' },
  { value: 'amsterdam', label: 'Amsterdam', country: 'Netherlands' },
  { value: 'zurich', label: 'Zurich', country: 'Switzerland' },
  { value: 'stockholm', label: 'Stockholm', country: 'Sweden' },
  { value: 'oslo', label: 'Oslo', country: 'Norway' },
  { value: 'copenhagen', label: 'Copenhagen', country: 'Denmark' },
  { value: 'helsinki', label: 'Helsinki', country: 'Finland' },
  { value: 'tokyo', label: 'Tokyo', country: 'Japan' },
  { value: 'seoul', label: 'Seoul', country: 'South Korea' },
  { value: 'singapore', label: 'Singapore', country: 'Singapore' },
  { value: 'wellington', label: 'Wellington', country: 'New Zealand' },
  { value: 'dublin', label: 'Dublin', country: 'Ireland' },
  { value: 'vienna', label: 'Vienna', country: 'Austria' },
  { value: 'lisbon', label: 'Lisbon', country: 'Portugal' },
  { value: 'brussels', label: 'Brussels', country: 'Belgium' },
  { value: 'los-angeles', label: 'Los Angeles', country: 'United States' },
  { value: 'chicago', label: 'Chicago', country: 'United States' },
  { value: 'houston', label: 'Houston', country: 'United States' },
  { value: 'phoenix', label: 'Phoenix', country: 'United States' },
  { value: 'philadelphia', label: 'Philadelphia', country: 'United States' },
  { value: 'san-antonio', label: 'San Antonio', country: 'United States' },
  { value: 'san-diego', label: 'San Diego', country: 'United States' },
  { value: 'dallas', label: 'Dallas', country: 'United States' },
  { value: 'vancouver', label: 'Vancouver', country: 'Canada' },
  { value: 'montreal', label: 'Montreal', country: 'Canada' },
  { value: 'calgary', label: 'Calgary', country: 'Canada' },
  { value: 'ottawa', label: 'Ottawa', country: 'Canada' },
  { value: 'manchester', label: 'Manchester', country: 'United Kingdom' },
  { value: 'birmingham', label: 'Birmingham', country: 'United Kingdom' },
  { value: 'glasgow', label: 'Glasgow', country: 'United Kingdom' },
  { value: 'leeds', label: 'Leeds', country: 'United Kingdom' },
  { value: 'liverpool', label: 'Liverpool', country: 'United Kingdom' },
  { value: 'melbourne', label: 'Melbourne', country: 'Australia' },
  { value: 'brisbane', label: 'Brisbane', country: 'Australia' },
  { value: 'perth', label: 'Perth', country: 'Australia' },
  { value: 'adelaide', label: 'Adelaide', country: 'Australia' },
];

interface CityPickerProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CityPicker({ 
  value, 
  onValueChange, 
  placeholder = "Select city...",
  className 
}: CityPickerProps) {
  const [open, setOpen] = useState(false);

  const selectedCity = useMemo(() => 
    cities.find((city) => city.value === value),
    [value]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedCity ? `${selectedCity.label}, ${selectedCity.country}` : placeholder}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 pointer-events-auto" align="start">
        <Command>
          <CommandInput placeholder="Search city..." />
          <CommandList>
            <CommandEmpty>No city found.</CommandEmpty>
            <CommandGroup>
              {cities.map((city) => (
                <CommandItem
                  key={city.value}
                  value={city.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === city.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{city.label}</span>
                    <span className="text-xs text-muted-foreground">{city.country}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}