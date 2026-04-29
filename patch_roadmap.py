import re

with open('public/student.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find start of roadmap tab and the next tab comment
start_marker = '<div id="tab-roadmap"'
end_marker = '<!-- ===== TAB: SKILLS ====='

start_idx = content.index(start_marker)
end_idx = content.index(end_marker)

# Build new roadmap section
new_section = '''<div id="tab-roadmap" class="tab-content hidden" style="padding: 0; margin: -48px; height: calc(100vh - 64px);">
          <iframe
            id="careerpath-frame"
            src="/careerpath/"
            style="width: 100%; height: 100%; border: none; display: block;"
            title="AI Career Guidance"
          ></iframe>
        </div>

        '''

content = content[:start_idx] + new_section + content[end_idx:]

with open('public/student.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done. Replaced roadmap tab with iframe embed.')
print(f'New file size: {len(content)} bytes')
