import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

export type Section = 'login' | 'admin' | 'reviewer' | 'fieldstaff';

export interface DbCol  { name: string; type: string; pk?: boolean; fk?: boolean; }
export interface DbTable { name: string; icon: string; cols: DbCol[]; }

@Component({
  selector: 'app-flowchart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './flowchart.html',
  styleUrl: './flowchart.css',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class FlowchartComponent {

  section: Section = 'login';
  hovered: string | null = null;

  constructor(private router: Router) {}

  setSection(s: Section): void { this.section = s; this.hovered = null; }
  hover(id: string | null): void { this.hovered = id; }
  goBack(): void { this.router.navigate(['/welcome']); }

  // ============================================================
  // NODE → TABLES MAP
  // ============================================================
  readonly nodeMap: Record<string, string[]> = {
    // LOGIN
    'L1':  [],
    'L2':  [],
    'L3':  ['users'],
    'L4':  ['users'],
    'L5':  ['users'],
    'L6':  ['users'],
    'L7':  ['otp_tokens'],
    'L8':  ['otp_tokens'],
    'L9':  ['user_sessions'],
    'L10': ['user_sessions'],
    'L11': ['users'],
    // ADMIN
    'A1':  ['users', 'user_sessions'],
    'A2':  ['users', 'role_table'],
    'A3':  ['users'],
    'A4':  ['gis_layers'],
    'A5':  ['approval_requests', 'approval_history'],
    'A6':  ['user_sessions'],
    // REVIEWER
    'R1':  ['users', 'user_sessions'],
    'R2':  ['approval_requests', 'users'],
    'R3':  ['plant_data', 'approval_requests'],
    'R4':  ['approval_requests', 'approval_history'],
    'R5':  ['plant_data', 'approval_history'],
    // FIELD STAFF
    'F1':  ['users'],
    'F2':  ['users', 'user_sessions', 'otp_tokens'],
    'F3':  ['plant_data', 'plant_images'],
    'F4':  ['approval_requests'],
    'F5':  ['approval_requests', 'approval_history'],
    'F6':  ['plant_data'],
  };

  active(id: string): boolean {
    return !!this.hovered && (this.nodeMap[this.hovered] ?? []).includes(id);
  }

  get activeTables(): string[] {
    return this.hovered ? (this.nodeMap[this.hovered] ?? []) : [];
  }

  // ============================================================
  // DB TABLES
  // ============================================================
  readonly tables: DbTable[] = [
    {
      name: 'users', icon: '👤',
      cols: [
        { name: 'user_id',         type: 'BIGINT',       pk: true },
        { name: 'username',        type: 'VARCHAR(100)' },
        { name: 'email_id',        type: 'VARCHAR(150)' },
        { name: 'password_hash',   type: 'TEXT' },
        { name: 'role_id',         type: 'INT',          fk: true },
        { name: 'is_active',       type: 'BOOLEAN' },
        { name: 'created_at',      type: 'TIMESTAMP' },
        { name: 'updated_at',      type: 'TIMESTAMP' },
      ]
    },
    {
      name: 'role_table', icon: '🎭',
      cols: [
        { name: 'role_id',   type: 'INT',         pk: true },
        { name: 'role_name', type: 'VARCHAR(50)' },
        { name: 'status',    type: 'VARCHAR(20)' },
      ]
    },
    {
      name: 'otp_tokens', icon: '🔢',
      cols: [
        { name: 'id',          type: 'BIGINT',      pk: true },
        { name: 'user_id',     type: 'BIGINT',      fk: true },
        { name: 'otp_code',    type: 'VARCHAR(10)' },
        { name: 'expires_at',  type: 'TIMESTAMP' },
        { name: 'verified',    type: 'BOOLEAN' },
        { name: 'created_at',  type: 'TIMESTAMP' },
      ]
    },
    {
      name: 'user_sessions', icon: '🔐',
      cols: [
        { name: 'id',                  type: 'BIGINT',       pk: true },
        { name: 'user_id',             type: 'BIGINT',       fk: true },
        { name: 'session_id',          type: 'UUID' },
        { name: 'token',               type: 'TEXT' },
        { name: 'is_active',           type: 'BOOLEAN' },
        { name: 'expires_at',          type: 'TIMESTAMP' },
        { name: 'created_at',          type: 'TIMESTAMP' },
        { name: 'invalidated_at',      type: 'TIMESTAMP' },
        { name: 'invalidation_reason', type: 'VARCHAR(50)' },
      ]
    },
    {
      name: 'plant_data', icon: '🌿',
      cols: [
        { name: 'plant_id',         type: 'BIGINT',       pk: true },
        { name: 'plant_name',       type: 'VARCHAR(150)' },
        { name: 'common_name',      type: 'VARCHAR(150)' },
        { name: 'scientific_name',  type: 'VARCHAR(200)' },
        { name: 'description',      type: 'TEXT' },
        { name: 'submitted_by',     type: 'BIGINT',       fk: true },
        { name: 'status',           type: 'VARCHAR(30)' },
        { name: 'location_lat',     type: 'DECIMAL(10,7)' },
        { name: 'location_lng',     type: 'DECIMAL(10,7)' },
        { name: 'created_at',       type: 'TIMESTAMP' },
      ]
    },
    {
      name: 'plant_images', icon: '📷',
      cols: [
        { name: 'image_id',   type: 'BIGINT',  pk: true },
        { name: 'plant_id',   type: 'BIGINT',  fk: true },
        { name: 'file_path',  type: 'TEXT' },
        { name: 'mime_type',  type: 'VARCHAR(100)' },
        { name: 'file_size',  type: 'BIGINT' },
      ]
    },
    {
      name: 'approval_requests', icon: '📋',
      cols: [
        { name: 'id',                    type: 'BIGINT',      pk: true },
        { name: 'plant_id',              type: 'BIGINT',      fk: true },
        { name: 'submitted_by',          type: 'BIGINT',      fk: true },
        { name: 'status',                type: 'VARCHAR(30)' },
        { name: 'current_review_level',  type: 'INT' },
        { name: 'submitted_at',          type: 'TIMESTAMP' },
        { name: 'completed_at',          type: 'TIMESTAMP' },
      ]
    },
    {
      name: 'approval_history', icon: '📜',
      cols: [
        { name: 'id',             type: 'BIGINT',      pk: true },
        { name: 'request_id',     type: 'BIGINT',      fk: true },
        { name: 'reviewer_id',    type: 'BIGINT',      fk: true },
        { name: 'action',         type: 'VARCHAR(20)' },
        { name: 'comments',       type: 'TEXT' },
        { name: 'action_at',      type: 'TIMESTAMP' },
      ]
    },
    {
      name: 'gis_layers', icon: '🗺️',
      cols: [
        { name: 'layer_id',    type: 'BIGINT',       pk: true },
        { name: 'layer_name',  type: 'VARCHAR(100)' },
        { name: 'layer_type',  type: 'VARCHAR(50)' },
        { name: 'source_url',  type: 'TEXT' },
        { name: 'is_active',   type: 'BOOLEAN' },
        { name: 'created_at',  type: 'TIMESTAMP' },
      ]
    },
  ];
}
