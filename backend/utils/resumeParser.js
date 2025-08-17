const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');

class ResumeParser {
  constructor() {
    // Skills categorization patterns
    this.skillCategories = {
      technical: [
        'javascript', 'python', 'java', 'react', 'node.js', 'sql', 'mongodb', 'aws', 'docker', 'kubernetes',
        'machine learning', 'ai', 'data science', 'blockchain', 'cybersecurity', 'cloud computing'
      ],
      clinical: [
        'psychotherapy', 'cbt', 'dbt', 'emdr', 'trauma therapy', 'group therapy', 'family therapy',
        'substance abuse', 'addiction counseling', 'crisis intervention', 'assessment', 'diagnosis'
      ],
      certifications: [
        'licensed', 'certified', 'lcsw', 'lpc', 'lmft', 'phd', 'md', 'psy.d', 'msw', 'ma psychology',
        'board certified', 'apa', 'nasw', 'nbcc', 'aamft'
      ],
      soft_skills: [
        'communication', 'empathy', 'active listening', 'problem solving', 'leadership', 'teamwork',
        'cultural competency', 'multilingual', 'crisis management', 'conflict resolution'
      ]
    };

    // Education level patterns
    this.educationPatterns = {
      doctorate: /ph\.?d|doctorate|doctor|psy\.?d|ed\.?d/i,
      masters: /master|m\.?a|m\.?s|m\.?ed|msw|m\.?phil/i,
      bachelors: /bachelor|b\.?a|b\.?s|b\.?ed/i,
      associate: /associate|a\.?a|a\.?s/i
    };

    // Experience extraction patterns
    this.experiencePatterns = {
      years: /(\d+)[\s\-\+]*(?:years?|yrs?)/i,
      positions: /therapist|counselor|psychologist|psychiatrist|social worker|coach|consultant/i,
      workplace: /hospital|clinic|practice|center|university|school|nonprofit|agency/i
    };
  }

  async parseResume(filePath, fileType) {
    try {
      let extractedText = '';
      
      if (fileType === 'application/pdf') {
        extractedText = await this.parsePDF(filePath);
      } else if (fileType.includes('word') || fileType.includes('document')) {
        extractedText = await this.parseWord(filePath);
      } else {
        throw new Error('Unsupported file type');
      }

      const parsedData = this.extractStructuredData(extractedText);
      return parsedData;
    } catch (error) {
      console.error('Resume parsing error:', error);
      throw new Error('Failed to parse resume');
    }
  }

  async parsePDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  }

  async parseWord(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  extractStructuredData(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    return {
      personalInfo: this.extractPersonalInfo(text, lines),
      education: this.extractEducation(text, lines),
      experience: this.extractExperience(text, lines),
      skills: this.extractSkills(text),
      certifications: this.extractCertifications(text, lines),
      summary: this.generateSummary(text),
      specializations: this.suggestSpecializations(text),
      yearsOfExperience: this.extractYearsOfExperience(text),
      keyHighlights: this.extractKeyHighlights(text, lines)
    };
  }

  extractPersonalInfo(text, lines) {
    const info = {};
    
    // Extract email
    const emailMatch = text.match(/[\w\.-]+@[\w\.-]+\.\w+/);
    if (emailMatch) info.email = emailMatch[0];
    
    // Extract phone
    const phoneMatch = text.match(/(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
    if (phoneMatch) info.phone = phoneMatch[0];
    
    // Extract name (usually first line or lines with typical name patterns)
    const nameCandidate = lines.find(line => {
      return line.length < 50 && 
             line.split(' ').length >= 2 && 
             line.split(' ').length <= 4 &&
             !/[@\d]/.test(line) &&
             line === line.toUpperCase() || 
             /^[A-Z][a-z]+ [A-Z][a-z]+/.test(line);
    });
    if (nameCandidate) info.name = nameCandidate;
    
    return info;
  }

  extractEducation(text, lines) {
    const education = [];
    const educationSection = this.extractSection(text, ['education', 'academic', 'qualification']);
    
    if (educationSection) {
      const educLines = educationSection.split('\n').filter(line => line.trim());
      
      educLines.forEach(line => {
        const degree = this.identifyDegreeLevel(line);
        const institution = this.extractInstitution(line);
        const year = this.extractYear(line);
        const field = this.extractField(line);
        
        if (degree || institution) {
          education.push({
            degree,
            institution,
            field,
            year,
            raw: line.trim()
          });
        }
      });
    }
    
    return education;
  }

  extractExperience(text, lines) {
    const experience = [];
    const expSection = this.extractSection(text, ['experience', 'work', 'employment', 'career', 'professional']);
    
    if (expSection) {
      const expLines = expSection.split('\n').filter(line => line.trim());
      let currentExp = null;
      
      expLines.forEach(line => {
        if (this.isJobTitle(line)) {
          if (currentExp) experience.push(currentExp);
          currentExp = {
            position: line.trim(),
            company: '',
            duration: '',
            responsibilities: [],
            raw: line.trim()
          };
        } else if (currentExp) {
          if (this.isCompanyName(line)) {
            currentExp.company = line.trim();
          } else if (this.isDuration(line)) {
            currentExp.duration = line.trim();
          } else if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
            currentExp.responsibilities.push(line.replace(/^[•\-*]\s*/, '').trim());
          }
        }
      });
      
      if (currentExp) experience.push(currentExp);
    }
    
    return experience;
  }

  extractSkills(text) {
    const skills = {
      technical: [],
      clinical: [],
      soft: [],
      other: []
    };
    
    const textLower = text.toLowerCase();
    
    // Match skills against categories
    Object.entries(this.skillCategories).forEach(([category, skillList]) => {
      skillList.forEach(skill => {
        if (textLower.includes(skill.toLowerCase())) {
          if (category === 'technical') skills.technical.push(skill);
          else if (category === 'clinical') skills.clinical.push(skill);
          else if (category === 'soft_skills') skills.soft.push(skill);
        }
      });
    });
    
    // Extract skills from dedicated skills section
    const skillsSection = this.extractSection(text, ['skills', 'competencies', 'expertise']);
    if (skillsSection) {
      const skillLines = skillsSection.split('\n');
      skillLines.forEach(line => {
        const lineSkills = line.split(/[,;|]/).map(s => s.trim()).filter(s => s.length > 2);
        skills.other.push(...lineSkills);
      });
    }
    
    return skills;
  }

  extractCertifications(text, lines) {
    const certifications = [];
    const certSection = this.extractSection(text, ['certification', 'license', 'credential']);
    
    if (certSection) {
      const certLines = certSection.split('\n').filter(line => line.trim());
      certLines.forEach(line => {
        if (line.length > 10 && line.length < 200) {
          certifications.push({
            name: line.trim(),
            type: this.identifyCertificationType(line),
            year: this.extractYear(line)
          });
        }
      });
    }
    
    // Also look for certifications mentioned throughout the resume
    this.skillCategories.certifications.forEach(cert => {
      if (text.toLowerCase().includes(cert.toLowerCase())) {
        certifications.push({
          name: cert,
          type: 'professional',
          mentioned: true
        });
      }
    });
    
    return certifications;
  }

  generateSummary(text) {
    const sentences = text.match(/[^\.!?]+[\.!?]+/g) || [];
    const relevantSentences = sentences.filter(sentence => {
      const lower = sentence.toLowerCase();
      return lower.includes('experience') || 
             lower.includes('specialize') || 
             lower.includes('expert') ||
             lower.includes('help') ||
             lower.includes('counsel') ||
             lower.includes('therapy') ||
             lower.includes('years');
    }).slice(0, 3);
    
    return relevantSentences.join(' ').trim() || 'Experienced professional with relevant background.';
  }

  suggestSpecializations(text) {
    const specializations = [];
    const textLower = text.toLowerCase();
    
    const specializationMap = {
      'Mental Health Counselor': ['depression', 'anxiety', 'mental health', 'therapy', 'counseling'],
      'Trauma Therapist': ['trauma', 'ptsd', 'emdr', 'crisis', 'abuse'],
      'Family Therapist': ['family', 'marriage', 'couples', 'relationship', 'family therapy'],
      'Addiction Counselor': ['addiction', 'substance', 'recovery', 'sobriety', 'rehabilitation'],
      'Child Psychologist': ['child', 'adolescent', 'youth', 'pediatric', 'developmental'],
      'Clinical Psychologist': ['clinical', 'assessment', 'diagnosis', 'psychological testing'],
      'Faith Counselor': ['faith', 'spiritual', 'religious', 'pastoral', 'christian', 'biblical'],
      'Life Coach': ['coaching', 'motivation', 'goal', 'personal development', 'success'],
      'Career Counselor': ['career', 'job', 'employment', 'professional development', 'workplace']
    };
    
    Object.entries(specializationMap).forEach(([spec, keywords]) => {
      const matchCount = keywords.filter(keyword => textLower.includes(keyword)).length;
      if (matchCount >= 2) {
        specializations.push({
          name: spec,
          confidence: matchCount / keywords.length,
          matchedKeywords: keywords.filter(keyword => textLower.includes(keyword))
        });
      }
    });
    
    return specializations.sort((a, b) => b.confidence - a.confidence);
  }

  extractYearsOfExperience(text) {
    const yearMatches = text.match(/(\d+)[\s\-\+]*(?:years?|yrs?)/gi) || [];
    const years = yearMatches.map(match => parseInt(match.match(/\d+/)[0]));
    return years.length > 0 ? Math.max(...years) : 0;
  }

  extractKeyHighlights(text, lines) {
    const highlights = [];
    
    // Look for achievement-oriented sentences
    const achievementPatterns = [
      /(?:achieved|accomplished|improved|increased|reduced|managed|led|developed)/i,
      /(?:\d+%|\d+\+|over \d+|more than \d+)/i,
      /(?:award|recognition|honor|certification)/i
    ];
    
    lines.forEach(line => {
      const matchCount = achievementPatterns.filter(pattern => pattern.test(line)).length;
      if (matchCount >= 1 && line.length > 20 && line.length < 200) {
        highlights.push(line);
      }
    });
    
    return highlights.slice(0, 5);
  }

  // Helper methods
  extractSection(text, sectionNames) {
    for (const sectionName of sectionNames) {
      const regex = new RegExp(`\\b${sectionName}\\b[\\s\\S]*?(?=\\b(?:experience|education|skills|certification|reference)\\b|$)`, 'i');
      const match = text.match(regex);
      if (match) return match[0];
    }
    return null;
  }

  identifyDegreeLevel(text) {
    for (const [level, pattern] of Object.entries(this.educationPatterns)) {
      if (pattern.test(text)) return level;
    }
    return null;
  }

  extractInstitution(text) {
    // Look for university/college patterns
    const institutionPattern = /(university|college|institute|school|academy)/i;
    if (institutionPattern.test(text)) {
      return text.split(',')[0].trim();
    }
    return null;
  }

  extractField(text) {
    const fieldPatterns = [
      /psychology/i, /counseling/i, /social work/i, /therapy/i, /mental health/i,
      /computer science/i, /engineering/i, /business/i, /education/i
    ];
    
    for (const pattern of fieldPatterns) {
      if (pattern.test(text)) {
        return text.match(pattern)[0];
      }
    }
    return null;
  }

  extractYear(text) {
    const yearMatch = text.match(/\b(19|20)\d{2}\b/);
    return yearMatch ? yearMatch[0] : null;
  }

  isJobTitle(text) {
    return this.experiencePatterns.positions.test(text) || 
           text.length < 60 && 
           text.split(' ').length <= 6 &&
           !text.includes('@') &&
           !text.includes('•');
  }

  isCompanyName(text) {
    return this.experiencePatterns.workplace.test(text) ||
           (text.length < 80 && text.split(' ').length <= 8 && !text.startsWith('•'));
  }

  isDuration(text) {
    return /\d{4}|present|current|months?|years?/i.test(text) && text.length < 50;
  }

  identifyCertificationType(text) {
    if (/license/i.test(text)) return 'license';
    if (/board|certified/i.test(text)) return 'certification';
    if (/training|course|workshop/i.test(text)) return 'training';
    return 'credential';
  }
}

module.exports = ResumeParser;