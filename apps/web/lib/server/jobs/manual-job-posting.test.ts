import { describe, expect, it } from 'vitest';
import { extractJobSkills, inferWorkMode, stripHtml } from '../job-matching';

describe('Job Cleaning & Extraction Guardrails', () => {
  it('strips messy HTML tags and script injections from job descriptions', () => {
    const rawHtml = `
      <div class="job-container">
        <h1>Senior Backend Engineer</h1>
        <p>We are hiring! Join us at Swiggy.</p>
        <script>alert('malicious')</script>
        <ul>
          <li>Build high-throughput APIs with Go and PostgreSQL.</li>
          <li>Design scalable microservices on Kubernetes.</li>
        </ul>
        &nbsp;&nbsp;&amp;&nbsp;
      </div>
    `;

    const cleaned = stripHtml(rawHtml);
    expect(cleaned).not.toContain('<div');
    expect(cleaned).not.toContain('</div>');
    expect(cleaned).not.toContain('<script>');
    expect(cleaned).not.toContain('&nbsp;');
    expect(cleaned).toContain('Build high-throughput APIs with Go and PostgreSQL.');
  });

  it('accurately infers work mode from title and description', () => {
    expect(inferWorkMode('Frontend Engineer (Remote - India)', 'India', '')).toBe('remote');
    expect(inferWorkMode('Backend Engineer', 'Bangalore (Hybrid)', '3 days in office')).toBe('hybrid');
    expect(inferWorkMode('Site Reliability Engineer', 'Pune, India', 'Onsite at client datacenter')).toBe('onsite');
  });

  it('accurately extracts skills from description if none provided by poster', () => {
    const description = 'Looking for an engineer experienced in Python, Docker, AWS, React, and TypeScript.';
    const skills = extractJobSkills('Fullstack Engineer', description);
    expect(skills).toContain('Python');
    expect(skills).toContain('Docker');
    expect(skills).toContain('AWS');
    expect(skills).toContain('React');
    expect(skills).toContain('TypeScript');
  });
});

