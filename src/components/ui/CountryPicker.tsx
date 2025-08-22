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

const countries = [
  { value: 'afghanistan', label: 'Afghanistan', code: 'AF' },
  { value: 'albania', label: 'Albania', code: 'AL' },
  { value: 'algeria', label: 'Algeria', code: 'DZ' },
  { value: 'andorra', label: 'Andorra', code: 'AD' },
  { value: 'angola', label: 'Angola', code: 'AO' },
  { value: 'argentina', label: 'Argentina', code: 'AR' },
  { value: 'armenia', label: 'Armenia', code: 'AM' },
  { value: 'australia', label: 'Australia', code: 'AU' },
  { value: 'austria', label: 'Austria', code: 'AT' },
  { value: 'azerbaijan', label: 'Azerbaijan', code: 'AZ' },
  { value: 'bahamas', label: 'Bahamas', code: 'BS' },
  { value: 'bahrain', label: 'Bahrain', code: 'BH' },
  { value: 'bangladesh', label: 'Bangladesh', code: 'BD' },
  { value: 'barbados', label: 'Barbados', code: 'BB' },
  { value: 'belarus', label: 'Belarus', code: 'BY' },
  { value: 'belgium', label: 'Belgium', code: 'BE' },
  { value: 'belize', label: 'Belize', code: 'BZ' },
  { value: 'benin', label: 'Benin', code: 'BJ' },
  { value: 'bhutan', label: 'Bhutan', code: 'BT' },
  { value: 'bolivia', label: 'Bolivia', code: 'BO' },
  { value: 'bosnia', label: 'Bosnia and Herzegovina', code: 'BA' },
  { value: 'botswana', label: 'Botswana', code: 'BW' },
  { value: 'brazil', label: 'Brazil', code: 'BR' },
  { value: 'brunei', label: 'Brunei', code: 'BN' },
  { value: 'bulgaria', label: 'Bulgaria', code: 'BG' },
  { value: 'burkina', label: 'Burkina Faso', code: 'BF' },
  { value: 'burundi', label: 'Burundi', code: 'BI' },
  { value: 'cambodia', label: 'Cambodia', code: 'KH' },
  { value: 'cameroon', label: 'Cameroon', code: 'CM' },
  { value: 'canada', label: 'Canada', code: 'CA' },
  { value: 'cape-verde', label: 'Cape Verde', code: 'CV' },
  { value: 'central-african-republic', label: 'Central African Republic', code: 'CF' },
  { value: 'chad', label: 'Chad', code: 'TD' },
  { value: 'chile', label: 'Chile', code: 'CL' },
  { value: 'china', label: 'China', code: 'CN' },
  { value: 'colombia', label: 'Colombia', code: 'CO' },
  { value: 'comoros', label: 'Comoros', code: 'KM' },
  { value: 'congo', label: 'Congo', code: 'CG' },
  { value: 'costa-rica', label: 'Costa Rica', code: 'CR' },
  { value: 'croatia', label: 'Croatia', code: 'HR' },
  { value: 'cuba', label: 'Cuba', code: 'CU' },
  { value: 'cyprus', label: 'Cyprus', code: 'CY' },
  { value: 'czech-republic', label: 'Czech Republic', code: 'CZ' },
  { value: 'denmark', label: 'Denmark', code: 'DK' },
  { value: 'djibouti', label: 'Djibouti', code: 'DJ' },
  { value: 'dominica', label: 'Dominica', code: 'DM' },
  { value: 'dominican-republic', label: 'Dominican Republic', code: 'DO' },
  { value: 'ecuador', label: 'Ecuador', code: 'EC' },
  { value: 'egypt', label: 'Egypt', code: 'EG' },
  { value: 'el-salvador', label: 'El Salvador', code: 'SV' },
  { value: 'equatorial-guinea', label: 'Equatorial Guinea', code: 'GQ' },
  { value: 'eritrea', label: 'Eritrea', code: 'ER' },
  { value: 'estonia', label: 'Estonia', code: 'EE' },
  { value: 'eswatini', label: 'Eswatini', code: 'SZ' },
  { value: 'ethiopia', label: 'Ethiopia', code: 'ET' },
  { value: 'fiji', label: 'Fiji', code: 'FJ' },
  { value: 'finland', label: 'Finland', code: 'FI' },
  { value: 'france', label: 'France', code: 'FR' },
  { value: 'gabon', label: 'Gabon', code: 'GA' },
  { value: 'gambia', label: 'Gambia', code: 'GM' },
  { value: 'georgia', label: 'Georgia', code: 'GE' },
  { value: 'germany', label: 'Germany', code: 'DE' },
  { value: 'ghana', label: 'Ghana', code: 'GH' },
  { value: 'greece', label: 'Greece', code: 'GR' },
  { value: 'grenada', label: 'Grenada', code: 'GD' },
  { value: 'guatemala', label: 'Guatemala', code: 'GT' },
  { value: 'guinea', label: 'Guinea', code: 'GN' },
  { value: 'guinea-bissau', label: 'Guinea-Bissau', code: 'GW' },
  { value: 'guyana', label: 'Guyana', code: 'GY' },
  { value: 'haiti', label: 'Haiti', code: 'HT' },
  { value: 'honduras', label: 'Honduras', code: 'HN' },
  { value: 'hungary', label: 'Hungary', code: 'HU' },
  { value: 'iceland', label: 'Iceland', code: 'IS' },
  { value: 'india', label: 'India', code: 'IN' },
  { value: 'indonesia', label: 'Indonesia', code: 'ID' },
  { value: 'iran', label: 'Iran', code: 'IR' },
  { value: 'iraq', label: 'Iraq', code: 'IQ' },
  { value: 'ireland', label: 'Ireland', code: 'IE' },
  { value: 'israel', label: 'Israel', code: 'IL' },
  { value: 'italy', label: 'Italy', code: 'IT' },
  { value: 'ivory-coast', label: 'Ivory Coast', code: 'CI' },
  { value: 'jamaica', label: 'Jamaica', code: 'JM' },
  { value: 'japan', label: 'Japan', code: 'JP' },
  { value: 'jordan', label: 'Jordan', code: 'JO' },
  { value: 'kazakhstan', label: 'Kazakhstan', code: 'KZ' },
  { value: 'kenya', label: 'Kenya', code: 'KE' },
  { value: 'kiribati', label: 'Kiribati', code: 'KI' },
  { value: 'kuwait', label: 'Kuwait', code: 'KW' },
  { value: 'kyrgyzstan', label: 'Kyrgyzstan', code: 'KG' },
  { value: 'laos', label: 'Laos', code: 'LA' },
  { value: 'latvia', label: 'Latvia', code: 'LV' },
  { value: 'lebanon', label: 'Lebanon', code: 'LB' },
  { value: 'lesotho', label: 'Lesotho', code: 'LS' },
  { value: 'liberia', label: 'Liberia', code: 'LR' },
  { value: 'libya', label: 'Libya', code: 'LY' },
  { value: 'liechtenstein', label: 'Liechtenstein', code: 'LI' },
  { value: 'lithuania', label: 'Lithuania', code: 'LT' },
  { value: 'luxembourg', label: 'Luxembourg', code: 'LU' },
  { value: 'madagascar', label: 'Madagascar', code: 'MG' },
  { value: 'malawi', label: 'Malawi', code: 'MW' },
  { value: 'malaysia', label: 'Malaysia', code: 'MY' },
  { value: 'maldives', label: 'Maldives', code: 'MV' },
  { value: 'mali', label: 'Mali', code: 'ML' },
  { value: 'malta', label: 'Malta', code: 'MT' },
  { value: 'marshall-islands', label: 'Marshall Islands', code: 'MH' },
  { value: 'mauritania', label: 'Mauritania', code: 'MR' },
  { value: 'mauritius', label: 'Mauritius', code: 'MU' },
  { value: 'mexico', label: 'Mexico', code: 'MX' },
  { value: 'micronesia', label: 'Micronesia', code: 'FM' },
  { value: 'moldova', label: 'Moldova', code: 'MD' },
  { value: 'monaco', label: 'Monaco', code: 'MC' },
  { value: 'mongolia', label: 'Mongolia', code: 'MN' },
  { value: 'montenegro', label: 'Montenegro', code: 'ME' },
  { value: 'morocco', label: 'Morocco', code: 'MA' },
  { value: 'mozambique', label: 'Mozambique', code: 'MZ' },
  { value: 'myanmar', label: 'Myanmar', code: 'MM' },
  { value: 'namibia', label: 'Namibia', code: 'NA' },
  { value: 'nauru', label: 'Nauru', code: 'NR' },
  { value: 'nepal', label: 'Nepal', code: 'NP' },
  { value: 'netherlands', label: 'Netherlands', code: 'NL' },
  { value: 'new-zealand', label: 'New Zealand', code: 'NZ' },
  { value: 'nicaragua', label: 'Nicaragua', code: 'NI' },
  { value: 'niger', label: 'Niger', code: 'NE' },
  { value: 'nigeria', label: 'Nigeria', code: 'NG' },
  { value: 'north-korea', label: 'North Korea', code: 'KP' },
  { value: 'north-macedonia', label: 'North Macedonia', code: 'MK' },
  { value: 'norway', label: 'Norway', code: 'NO' },
  { value: 'oman', label: 'Oman', code: 'OM' },
  { value: 'pakistan', label: 'Pakistan', code: 'PK' },
  { value: 'palau', label: 'Palau', code: 'PW' },
  { value: 'panama', label: 'Panama', code: 'PA' },
  { value: 'papua-new-guinea', label: 'Papua New Guinea', code: 'PG' },
  { value: 'paraguay', label: 'Paraguay', code: 'PY' },
  { value: 'peru', label: 'Peru', code: 'PE' },
  { value: 'philippines', label: 'Philippines', code: 'PH' },
  { value: 'poland', label: 'Poland', code: 'PL' },
  { value: 'portugal', label: 'Portugal', code: 'PT' },
  { value: 'qatar', label: 'Qatar', code: 'QA' },
  { value: 'romania', label: 'Romania', code: 'RO' },
  { value: 'russia', label: 'Russia', code: 'RU' },
  { value: 'rwanda', label: 'Rwanda', code: 'RW' },
  { value: 'saint-kitts-and-nevis', label: 'Saint Kitts and Nevis', code: 'KN' },
  { value: 'saint-lucia', label: 'Saint Lucia', code: 'LC' },
  { value: 'saint-vincent', label: 'Saint Vincent and the Grenadines', code: 'VC' },
  { value: 'samoa', label: 'Samoa', code: 'WS' },
  { value: 'san-marino', label: 'San Marino', code: 'SM' },
  { value: 'sao-tome', label: 'Sao Tome and Principe', code: 'ST' },
  { value: 'saudi-arabia', label: 'Saudi Arabia', code: 'SA' },
  { value: 'senegal', label: 'Senegal', code: 'SN' },
  { value: 'serbia', label: 'Serbia', code: 'RS' },
  { value: 'seychelles', label: 'Seychelles', code: 'SC' },
  { value: 'sierra-leone', label: 'Sierra Leone', code: 'SL' },
  { value: 'singapore', label: 'Singapore', code: 'SG' },
  { value: 'slovakia', label: 'Slovakia', code: 'SK' },
  { value: 'slovenia', label: 'Slovenia', code: 'SI' },
  { value: 'solomon-islands', label: 'Solomon Islands', code: 'SB' },
  { value: 'somalia', label: 'Somalia', code: 'SO' },
  { value: 'south-africa', label: 'South Africa', code: 'ZA' },
  { value: 'south-korea', label: 'South Korea', code: 'KR' },
  { value: 'south-sudan', label: 'South Sudan', code: 'SS' },
  { value: 'spain', label: 'Spain', code: 'ES' },
  { value: 'sri-lanka', label: 'Sri Lanka', code: 'LK' },
  { value: 'sudan', label: 'Sudan', code: 'SD' },
  { value: 'suriname', label: 'Suriname', code: 'SR' },
  { value: 'sweden', label: 'Sweden', code: 'SE' },
  { value: 'switzerland', label: 'Switzerland', code: 'CH' },
  { value: 'syria', label: 'Syria', code: 'SY' },
  { value: 'taiwan', label: 'Taiwan', code: 'TW' },
  { value: 'tajikistan', label: 'Tajikistan', code: 'TJ' },
  { value: 'tanzania', label: 'Tanzania', code: 'TZ' },
  { value: 'thailand', label: 'Thailand', code: 'TH' },
  { value: 'timor-leste', label: 'Timor-Leste', code: 'TL' },
  { value: 'togo', label: 'Togo', code: 'TG' },
  { value: 'tonga', label: 'Tonga', code: 'TO' },
  { value: 'trinidad-and-tobago', label: 'Trinidad and Tobago', code: 'TT' },
  { value: 'tunisia', label: 'Tunisia', code: 'TN' },
  { value: 'turkey', label: 'Turkey', code: 'TR' },
  { value: 'turkmenistan', label: 'Turkmenistan', code: 'TM' },
  { value: 'tuvalu', label: 'Tuvalu', code: 'TV' },
  { value: 'uganda', label: 'Uganda', code: 'UG' },
  { value: 'ukraine', label: 'Ukraine', code: 'UA' },
  { value: 'united-arab-emirates', label: 'United Arab Emirates', code: 'AE' },
  { value: 'united-kingdom', label: 'United Kingdom', code: 'GB' },
  { value: 'united-states', label: 'United States', code: 'US' },
  { value: 'uruguay', label: 'Uruguay', code: 'UY' },
  { value: 'uzbekistan', label: 'Uzbekistan', code: 'UZ' },
  { value: 'vanuatu', label: 'Vanuatu', code: 'VU' },
  { value: 'vatican-city', label: 'Vatican City', code: 'VA' },
  { value: 'venezuela', label: 'Venezuela', code: 'VE' },
  { value: 'vietnam', label: 'Vietnam', code: 'VN' },
  { value: 'yemen', label: 'Yemen', code: 'YE' },
  { value: 'zambia', label: 'Zambia', code: 'ZM' },
  { value: 'zimbabwe', label: 'Zimbabwe', code: 'ZW' },
];

interface CountryPickerProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CountryPicker({ 
  value, 
  onValueChange, 
  placeholder = "Select country...",
  className 
}: CountryPickerProps) {
  const [open, setOpen] = useState(false);

  const selectedCountry = useMemo(() => 
    countries.find((country) => country.value === value),
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
          {selectedCountry ? selectedCountry.label : placeholder}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 pointer-events-auto" align="start">
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {countries.map((country) => (
                <CommandItem
                  key={country.value}
                  value={country.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === country.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="mr-2 text-xs opacity-60">{country.code}</span>
                  {country.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}