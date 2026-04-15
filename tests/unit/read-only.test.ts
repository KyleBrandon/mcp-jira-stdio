import { describe, it, expect } from 'vitest';
import { TOOL_NAMES } from '../../src/config/constants.js';
import * as tools from '../../src/tools/index.js';

const WRITE_TOOL_NAMES: Set<string> = new Set([
  TOOL_NAMES.CREATE_ISSUE,
  TOOL_NAMES.UPDATE_ISSUE,
  TOOL_NAMES.ADD_COMMENT,
  TOOL_NAMES.CREATE_SUBTASK,
  TOOL_NAMES.CREATE_ISSUE_LINK,
  TOOL_NAMES.ADD_ATTACHMENT,
  TOOL_NAMES.DELETE_ATTACHMENT,
  TOOL_NAMES.TRANSITION_ISSUE,
]);

const READ_TOOL_NAMES: Set<string> = new Set([
  TOOL_NAMES.GET_VISIBLE_PROJECTS,
  TOOL_NAMES.GET_ISSUE,
  TOOL_NAMES.SEARCH_ISSUES,
  TOOL_NAMES.GET_MY_ISSUES,
  TOOL_NAMES.GET_ISSUE_TYPES,
  TOOL_NAMES.GET_USERS,
  TOOL_NAMES.GET_PRIORITIES,
  TOOL_NAMES.GET_STATUSES,
  TOOL_NAMES.GET_PROJECT_INFO,
  TOOL_NAMES.GET_CREATE_META,
  TOOL_NAMES.GET_CUSTOM_FIELDS,
  TOOL_NAMES.GET_COMMENTS,
  TOOL_NAMES.GET_ATTACHMENTS,
  TOOL_NAMES.GET_TRANSITIONS,
]);

const allTools = [
  tools.getVisibleProjectsTool,
  tools.getIssueTool,
  tools.searchIssuesTool,
  tools.getMyIssuesTool,
  tools.getIssueTypesTool,
  tools.getUsersTool,
  tools.getPrioritiesTool,
  tools.getStatusesTool,
  tools.createIssueTool,
  tools.updateIssueTool,
  tools.addCommentTool,
  tools.getProjectInfoTool,
  tools.createSubtaskTool,
  tools.getCreateMetaTool,
  tools.getCustomFieldsTool,
  tools.createIssueLinkTool,
  tools.getCommentsTool,
  tools.addAttachmentTool,
  tools.getAttachmentsTool,
  tools.deleteAttachmentTool,
  tools.getTransitionsTool,
  tools.transitionIssueTool,
];

function parseReadOnly(value: string | undefined): boolean {
  return (value ?? 'true').toLowerCase() !== 'false';
}

describe('read-only mode', () => {
  describe('JIRA_READ_ONLY parsing', () => {
    it('should default to read-only when env var is unset', () => {
      expect(parseReadOnly(undefined)).toBe(true);
    });

    it('should be read-only when set to "true"', () => {
      expect(parseReadOnly('true')).toBe(true);
    });

    it('should be read-only when set to "TRUE"', () => {
      expect(parseReadOnly('TRUE')).toBe(true);
    });

    it('should be read-only when set to "1"', () => {
      expect(parseReadOnly('1')).toBe(true);
    });

    it('should be read-only when set to any arbitrary string', () => {
      expect(parseReadOnly('yes')).toBe(true);
      expect(parseReadOnly('on')).toBe(true);
      expect(parseReadOnly('anything')).toBe(true);
    });

    it('should disable read-only when set to "false"', () => {
      expect(parseReadOnly('false')).toBe(false);
    });

    it('should disable read-only when set to "FALSE"', () => {
      expect(parseReadOnly('FALSE')).toBe(false);
    });

    it('should disable read-only when set to "False"', () => {
      expect(parseReadOnly('False')).toBe(false);
    });
  });

  describe('tool filtering', () => {
    it('should filter out all write tools when read-only', () => {
      const filtered = allTools.filter((t) => !WRITE_TOOL_NAMES.has(t.name));
      for (const tool of filtered) {
        expect(WRITE_TOOL_NAMES.has(tool.name)).toBe(false);
      }
    });

    it('should keep all read tools when read-only', () => {
      const filtered = allTools.filter((t) => !WRITE_TOOL_NAMES.has(t.name));
      for (const name of READ_TOOL_NAMES) {
        expect(filtered.some((t) => t.name === name)).toBe(true);
      }
    });

    it('should include all tools when not read-only', () => {
      expect(allTools.length).toBe(WRITE_TOOL_NAMES.size + READ_TOOL_NAMES.size);
    });

    it('should filter exactly the write tools', () => {
      const filtered = allTools.filter((t) => !WRITE_TOOL_NAMES.has(t.name));
      expect(filtered.length).toBe(allTools.length - WRITE_TOOL_NAMES.size);
    });

    it('should remove write tool handlers when read-only', () => {
      const handlers = new Map<string, () => void>(
        allTools.map((t) => [t.name, vi.fn()])
      );

      for (const name of WRITE_TOOL_NAMES) {
        handlers.delete(name);
      }

      for (const name of WRITE_TOOL_NAMES) {
        expect(handlers.has(name)).toBe(false);
      }
      for (const name of READ_TOOL_NAMES) {
        expect(handlers.has(name)).toBe(true);
      }
    });
  });
});
